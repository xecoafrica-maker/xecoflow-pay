// frontend/hooks/useWebSocket.ts
/**
 * WebSocket Hook for Dashboard Real-time Updates
 * 
 * @module hooks/useWebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketState {
  isConnected: boolean;
  isAvailable: boolean;
  socketId: string | null;
  error: string | null;
  reconnectAttempts: number;
}

export interface WebSocketOptions {
  merchantId?: string;
  userId?: string;
  businessName?: string;
  subscriptions?: ('analytics' | 'transactions' | 'payments' | 'withdrawals')[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onPaymentUpdate?: (data: any) => void;
  onBalanceUpdate?: (data: any) => void;
  onTransactionUpdate?: (data: any) => void;
  onWithdrawalUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onStatsUpdate?: (data: any) => void;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const {
    merchantId,
    userId,
    businessName,
    subscriptions = ['analytics', 'transactions', 'payments'],
    onConnect,
    onDisconnect,
    onError,
    onPaymentUpdate,
    onBalanceUpdate,
    onTransactionUpdate,
    onWithdrawalUpdate,
    onNotification,
    onStatsUpdate
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isAvailable: true,
    socketId: null,
    error: null,
    reconnectAttempts: 0
  });

  const socketRef = useRef<Socket | null>(null);
  const isRegisteredRef = useRef(false);
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;
  const isConnecting = useRef(false);

  // ─── Register Merchant ──────────────────────────────────────────
  const registerMerchant = useCallback((socket: Socket) => {
    if (!socket.connected) {
      console.warn('⚠️ Socket not connected, cannot register');
      return false;
    }

    if (!merchantId) {
      console.warn('⚠️ No merchantId provided');
      return false;
    }

    const registrationData = {
      merchantId,
      userId: userId || merchantId,
      businessName: businessName || 'Merchant',
      subscriptions
    };

    console.log('📡 Registering merchant:', merchantId);
    socket.emit('register:merchant', registrationData);
    isRegisteredRef.current = true;
    return true;
  }, [merchantId, userId, businessName, subscriptions]);

  // ─── Connect to WebSocket ──────────────────────────────────────────
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting.current) {
      console.log('⏳ Connection already in progress');
      return;
    }

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    isConnecting.current = true;
    connectionAttempts.current += 1;

    // Check if we've exceeded max attempts
    if (connectionAttempts.current > maxConnectionAttempts) {
      console.log('❌ Max connection attempts reached, stopping');
      setState(prev => ({
        ...prev,
        isAvailable: false,
        error: 'Unable to connect to WebSocket server'
      }));
      isConnecting.current = false;
      return;
    }

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                   'wss://xecoflow-2gen.onrender.com';

    console.log(`🔌 Connecting to WebSocket (attempt ${connectionAttempts.current}):`, WS_URL);

    try {
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 1000,
        timeout: 5000,
        autoConnect: true
      });

      // ─── Connection Events ──────────────────────────────────────
      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        isConnecting.current = false;
        connectionAttempts.current = 0;
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isAvailable: true,
          socketId: socket.id || null,
          error: null,
          reconnectAttempts: 0
        }));

        // Register merchant
        if (merchantId) {
          setTimeout(() => {
            registerMerchant(socket);
          }, 200);
        }

        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          isConnected: false
        }));
        isRegisteredRef.current = false;
        onDisconnect?.();
      });

      socket.on('connect_error', (error) => {
        console.warn('⚠️ Connection error:', error.message);
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: error.message
        }));
        isConnecting.current = false;
        onError?.(error);
      });

      socket.on('connect_timeout', () => {
        console.warn('⏰ Connection timeout');
        isConnecting.current = false;
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Connection timeout'
        }));
      });

      // ─── Merchant Events ──────────────────────────────────────────
      socket.on('merchant:registered', (data) => {
        console.log('✅ Merchant registered:', data);
        isRegisteredRef.current = true;
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }));
      });

      socket.on('merchant:balance', (data) => {
        console.log('💰 Balance update:', data);
        onBalanceUpdate?.(data);
      });

      socket.on('merchant:payment', (data) => {
        console.log('💳 Payment update:', data);
        onPaymentUpdate?.(data);
      });

      socket.on('merchant:transaction', (data) => {
        console.log('📊 Transaction update:', data);
        onTransactionUpdate?.(data);
      });

      socket.on('merchant:withdrawal', (data) => {
        console.log('🏦 Withdrawal update:', data);
        onWithdrawalUpdate?.(data);
      });

      socket.on('merchant:notification', (data) => {
        console.log('🔔 Notification:', data);
        onNotification?.(data);
      });

      socket.on('merchant:stats', (data) => {
        console.log('📈 Stats update:', data);
        onStatsUpdate?.(data);
      });

      socket.on('merchant:error', (data) => {
        console.warn('⚠️ Merchant error:', data);
        setState(prev => ({
          ...prev,
          error: data.error || 'Unknown error'
        }));
      });

      socketRef.current = socket;

    } catch (error) {
      console.error('Failed to connect:', error);
      isConnecting.current = false;
      setState(prev => ({
        ...prev,
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      onError?.(error);
    }
  }, [merchantId, registerMerchant, onConnect, onDisconnect, onError, onBalanceUpdate, onPaymentUpdate, onTransactionUpdate, onWithdrawalUpdate, onNotification, onStatsUpdate]);

  // ─── Disconnect ───────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    isConnecting.current = false;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      socketId: null
    }));
    isRegisteredRef.current = false;
  }, []);

  // ─── Reconnect ───────────────────────────────────────────────────
  const reconnect = useCallback(() => {
    connectionAttempts.current = 0;
    setState(prev => ({
      ...prev,
      isAvailable: true,
      error: null
    }));
    connect();
  }, [connect]);

  // ─── Effect: Connect on mount ───────────────────────────────────
  useEffect(() => {
    if (merchantId) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        connect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [merchantId, connect]);

  // ─── Cleanup ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    registerMerchant: () => {
      if (socketRef.current) {
        return registerMerchant(socketRef.current);
      }
      return false;
    },
    socket: socketRef.current
  };
}

export default useWebSocket;