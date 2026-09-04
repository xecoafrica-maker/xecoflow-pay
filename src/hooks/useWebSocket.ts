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
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRegisteredRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;
  const registrationAttempts = useRef(0);
  const maxRegistrationAttempts = 10;

  // ─── Register Merchant with retry ──────────────────────────────────
  const registerMerchant = useCallback((socket?: Socket) => {
    const sock = socket || socketRef.current;
    
    if (!sock) {
      console.warn('Cannot register: socket not initialized');
      return false;
    }

    if (!sock.connected) {
      console.warn('Cannot register: socket not connected. Current state:', sock.connected);
      // Schedule retry
      if (registrationAttempts.current < maxRegistrationAttempts) {
        registrationAttempts.current += 1;
        setTimeout(() => {
          console.log(`🔄 Retrying registration (attempt ${registrationAttempts.current}/${maxRegistrationAttempts})...`);
          registerMerchant(sock);
        }, 1000 * registrationAttempts.current);
      } else {
        console.error('❌ Max registration attempts reached');
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: 'Failed to register after multiple attempts'
        }));
      }
      return false;
    }

    if (!merchantId) {
      console.warn('Cannot register: merchantId not provided');
      return false;
    }

    // Reset registration attempts on success
    registrationAttempts.current = 0;

    const registrationData = {
      merchantId,
      userId: userId || merchantId,
      businessName: businessName || 'Merchant',
      subscriptions
    };

    console.log('📡 Registering merchant:', merchantId, 'with data:', registrationData);
    sock.emit('register:merchant', registrationData);
    isRegisteredRef.current = true;
    return true;
  }, [merchantId, userId, businessName, subscriptions]);

  // ─── Connect to WebSocket ──────────────────────────────────────────
  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
                     'wss://xecoflow-2gen.onrender.com';

      console.log('🔌 Connecting to WebSocket:', WS_URL);

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true
      });

      // ─── Connection Events ──────────────────────────────────────
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

        // Reset registration attempts on successful connection
        registrationAttempts.current = 0;

        // Register merchant immediately after connection
        if (merchantId) {
          // Small delay to ensure connection is fully established
          setTimeout(() => {
            registerMerchant(socket);
          }, 100);
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

      // ─── Merchant Events ──────────────────────────────────────────
      
      // Registration confirmation
      socket.on('merchant:registered', (data) => {
        console.log('✅ Merchant registered successfully:', data);
        isRegisteredRef.current = true;
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }));
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

      // Handle connection timeout for registration
      socket.on('connect_timeout', () => {
        console.warn('⚠️ Connection timeout');
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: 'Connection timeout'
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
  }, [merchantId, onConnect, onDisconnect, onError, onBalanceUpdate, onPaymentUpdate, onTransactionUpdate, onWithdrawalUpdate, onNotification, onStatsUpdate, registerMerchant, state.reconnectAttempts]);

  // ─── Subscribe to Analytics ──────────────────────────────────────
  const subscribeToAnalytics = useCallback((metrics?: string[]) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot subscribe: socket not connected');
      return false;
    }

    socketRef.current.emit('subscribe:analytics', {
      merchantId,
      metrics: metrics || ['transactions', 'balance', 'payments']
    });
    return true;
  }, [merchantId]);

  // ─── Subscribe to Transactions ────────────────────────────────────
  const subscribeToTransactions = useCallback((limit?: number) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot subscribe: socket not connected');
      return false;
    }

    socketRef.current.emit('subscribe:transactions', {
      merchantId,
      limit: limit || 10
    });
    return true;
  }, [merchantId]);

  // ─── Request Stats ───────────────────────────────────────────────
  const requestStats = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('Cannot request stats: socket not connected');
      return false;
    }

    socketRef.current.emit('request:stats', { merchantId });
    return true;
  }, [merchantId]);

  // ─── Disconnect ───────────────────────────────────────────────────
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
    registrationAttempts.current = 0;
  }, []);

  // ─── Reconnect ───────────────────────────────────────────────────
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // ─── Effect: Connect on mount ───────────────────────────────────
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

  // ─── Effect: Reconnect on merchantId change ─────────────────────
  useEffect(() => {
    if (merchantId && socketRef.current) {
      // Re-register with new merchant ID
      isRegisteredRef.current = false;
      setTimeout(() => {
        registerMerchant();
      }, 500);
    }
  }, [merchantId, registerMerchant]);

  // ─── Effect: Check connection status periodically ───────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current) {
        const isConnected = socketRef.current.connected;
        if (isConnected !== state.isConnected) {
          setState(prev => ({
            ...prev,
            isConnected: isConnected
          }));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [state.isConnected]);

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