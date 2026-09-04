// frontend/hooks/useWebSocket.ts
/**
 * WebSocket Hook for Dashboard Real-time Updates
 * 
 * @module hooks/useWebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface WebSocketState {
  isConnected: boolean;
  isAvailable: boolean;
  socketId: string | null;
  error: string | null;
  reconnectAttempts: number;
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
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRegisteredRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  // ─── Connect to WebSocket ──────────────────────────────────────
  const connect = useCallback(() => {
    try {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                     (typeof window !== 'undefined' && window.location.origin) ||
                     'wss://xecoflow-2gen.onrender.com';

      console.log('🔌 Connecting to WebSocket:', WS_URL);

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true
      });

      // ─── Connection Events ──────────────────────────────────
      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isAvailable: true,
          socketId: socket.id || null,
          error: null,
          reconnectAttempts: 0
        }));

        // Register merchant if we have an ID
        if (merchantId && !isRegisteredRef.current) {
          registerMerchant(socket);
        }

        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: `Disconnected: ${reason}`
        }));
        isRegisteredRef.current = false;
        onDisconnect?.();
      });

      socket.on('connect_error', (error) => {
        console.warn('⚠️ WebSocket connection error:', error.message);
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: error.message,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));

        if (state.reconnectAttempts >= maxReconnectAttempts) {
          setState(prev => ({
            ...prev,
            isAvailable: false
          }));
        }

        onError?.(error);
      });

      // ─── Merchant Events ──────────────────────────────────────
      
      // Registration confirmation
      socket.on('merchant:registered', (data) => {
        console.log('📊 Merchant registered:', data);
        isRegisteredRef.current = true;
      });

      // Balance updates
      socket.on('merchant:balance', (data) => {
        console.log('💰 Balance update:', data);
        onBalanceUpdate?.(data);
      });

      // Payment updates
      socket.on('merchant:payment', (data) => {
        console.log('💳 Payment update:', data);
        onPaymentUpdate?.(data);
      });

      // Transaction updates
      socket.on('merchant:transaction', (data) => {
        console.log('📊 Transaction update:', data);
        onTransactionUpdate?.(data);
      });

      // Withdrawal updates
      socket.on('merchant:withdrawal', (data) => {
        console.log('🏦 Withdrawal update:', data);
        onWithdrawalUpdate?.(data);
      });

      // Notifications
      socket.on('merchant:notification', (data) => {
        console.log('🔔 Notification:', data);
        onNotification?.(data);
      });

      // Stats updates
      socket.on('merchant:stats', (data) => {
        console.log('📈 Stats update:', data);
        onStatsUpdate?.(data);
      });

      // Connection status
      socket.on('merchant:status', (data) => {
        console.log('📡 Status update:', data);
        setState(prev => ({
          ...prev,
          isConnected: true
        }));
      });

      // Error events
      socket.on('merchant:error', (data) => {
        console.warn('⚠️ Merchant error:', data);
        setState(prev => ({
          ...prev,
          error: data.error || 'Unknown error'
        }));
      });

      socketRef.current = socket;

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      onError?.(error);
    }
  }, [merchantId, onConnect, onDisconnect, onError, onBalanceUpdate, onPaymentUpdate, onTransactionUpdate, onWithdrawalUpdate, onNotification, onStatsUpdate]);

  // ─── Register Merchant ──────────────────────────────────────────
  const registerMerchant = useCallback((socket?: Socket) => {
    const sock = socket || socketRef.current;
    if (!sock || !sock.connected) {
      console.warn('Cannot register: socket not connected');
      return;
    }

    if (!merchantId) {
      console.warn('Cannot register: merchantId not provided');
      return;
    }

    const registrationData = {
      merchantId,
      userId: userId || merchantId,
      businessName: businessName || 'Merchant',
      subscriptions
    };

    sock.emit('register:merchant', registrationData);
    console.log('📡 Registering merchant:', merchantId);
  }, [merchantId, userId, businessName, subscriptions]);

  // ─── Subscribe to Analytics ──────────────────────────────────────
  const subscribeToAnalytics = useCallback((metrics?: string[]) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot subscribe: socket not connected');
      return;
    }

    socketRef.current.emit('subscribe:analytics', {
      merchantId,
      metrics: metrics || ['transactions', 'balance', 'payments']
    });
  }, [merchantId]);

  // ─── Subscribe to Transactions ───────────────────────────────────
  const subscribeToTransactions = useCallback((limit?: number) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot subscribe: socket not connected');
      return;
    }

    socketRef.current.emit('subscribe:transactions', {
      merchantId,
      limit: limit || 10
    });
  }, [merchantId]);

  // ─── Request Stats ──────────────────────────────────────────────
  const requestStats = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot request stats: socket not connected');
      return;
    }

    socketRef.current.emit('request:stats', { merchantId });
  }, [merchantId]);

  // ─── Disconnect ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
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

  // ─── Reconnect ──────────────────────────────────────────────────
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // ─── Effect: Connect on mount ──────────────────────────────────
  useEffect(() => {
    if (merchantId) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      disconnect();
    };
  }, [merchantId, connect, disconnect]);

  // ─── Effect: Reconnect on merchantId change ────────────────────
  useEffect(() => {
    if (merchantId && socketRef.current) {
      // Re-register with new merchant ID
      isRegisteredRef.current = false;
      registerMerchant();
    }
  }, [merchantId, registerMerchant]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    registerMerchant,
    subscribeToAnalytics,
    subscribeToTransactions,
    requestStats,
    socket: socketRef.current
  };
}

export default useWebSocket;