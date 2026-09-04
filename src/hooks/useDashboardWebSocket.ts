// frontend/hooks/useDashboardWebSocket.ts
/**
 * Dashboard WebSocket Hook
 * Combines WebSocket with dashboard state
 * 
 * @module dashboard/hooks/useDashboardWebSocket
 */

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface DashboardWebSocketProps {
  merchantId: string;
  merchantName: string;
  onNewTransaction?: (transaction: any) => void;
  onBalanceChange?: (balance: number) => void;
  onPaymentReceived?: (payment: any) => void;
}

export function useDashboardWebSocket({
  merchantId,
  merchantName,
  onNewTransaction,
  onBalanceChange,
  onPaymentReceived
}: DashboardWebSocketProps) {
  const { log, ActivityActions } = useActivityLogger();
  const [lastNotification, setLastNotification] = useState<any>(null);

  // ─── Handle Balance Update ──────────────────────────────────────
  const handleBalanceUpdate = useCallback((data: any) => {
    console.log('💰 Balance updated:', data);
    if (onBalanceChange) {
      onBalanceChange(data.balance);
    }
  }, [onBalanceChange]);

  // ─── Handle Payment Update ──────────────────────────────────────
  const handlePaymentUpdate = useCallback((data: any) => {
    console.log('💳 Payment received:', data);
    
    const isCompleted = data.payment?.status === 'COMPLETED' || 
                        data.payment?.status === 'SETTLED' ||
                        data.status === 'COMPLETED' ||
                        data.status === 'SETTLED';
    
    if (isCompleted) {
      setLastNotification({
        type: 'payment',
        title: '💰 New Payment Received!',
        message: `KES ${(data.payment?.amount || data.amount)?.toLocaleString()} received`,
        data: data.payment || data
      });

      if (onPaymentReceived) {
        onPaymentReceived(data.payment || data);
      }
    }
  }, [onPaymentReceived]);

  // ─── Handle Transaction Update ──────────────────────────────────
  const handleTransactionUpdate = useCallback((data: any) => {
    console.log('📊 Transaction update:', data);
    if (data.transaction && onNewTransaction) {
      onNewTransaction(data.transaction);
    }
  }, [onNewTransaction]);

  // ─── Handle Notification ────────────────────────────────────────
  const handleNotification = useCallback((data: any) => {
    console.log('🔔 Notification:', data);
    setLastNotification({
      type: 'notification',
      title: data.notification?.title || 'Notification',
      message: data.notification?.message || '',
      data: data.notification
    });
  }, []);

  // ─── Handle Stats Update ────────────────────────────────────────
  const handleStatsUpdate = useCallback((data: any) => {
    console.log('📈 Stats updated:', data);
  }, []);

  // ─── WebSocket Connection ──────────────────────────────────────
  const ws = useWebSocket({
    merchantId,
    businessName: merchantName,
    subscriptions: ['analytics', 'transactions', 'payments'],
    onBalanceUpdate: handleBalanceUpdate,
    onPaymentUpdate: handlePaymentUpdate,
    onTransactionUpdate: handleTransactionUpdate,
    onNotification: handleNotification,
    onStatsUpdate: handleStatsUpdate,
    onConnect: () => {
      console.log('✅ Dashboard WebSocket connected');
      log(
        ActivityActions.VIEW_DASHBOARD,
        `WebSocket connected for ${merchantName}`
      );
    },
    onError: (error) => {
      console.warn('⚠️ WebSocket error (non-critical):', error);
    }
  });

  // ─── Request Stats ──────────────────────────────────────────────
  const requestStats = useCallback(() => {
    if (ws.socket && ws.socket.connected) {
      ws.socket.emit('request:stats', { merchantId });
      return true;
    }
    console.warn('Cannot request stats: socket not connected');
    return false;
  }, [ws.socket, merchantId]);

  // ─── Subscribe to Analytics ─────────────────────────────────────
  const subscribeToAnalytics = useCallback((metrics?: string[]) => {
    if (ws.socket && ws.socket.connected) {
      ws.socket.emit('subscribe:analytics', {
        merchantId,
        metrics: metrics || ['transactions', 'balance', 'payments']
      });
      return true;
    }
    return false;
  }, [ws.socket, merchantId]);

  // ─── Subscribe to Transactions ──────────────────────────────────
  const subscribeToTransactions = useCallback((limit?: number) => {
    if (ws.socket && ws.socket.connected) {
      ws.socket.emit('subscribe:transactions', {
        merchantId,
        limit: limit || 10
      });
      return true;
    }
    return false;
  }, [ws.socket, merchantId]);

  return {
    ...ws,
    lastNotification,
    clearNotification: () => setLastNotification(null),
    requestStats,
    subscribeToAnalytics,
    subscribeToTransactions
  };
}

export default useDashboardWebSocket;