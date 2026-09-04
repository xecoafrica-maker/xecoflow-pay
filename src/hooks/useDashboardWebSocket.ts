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
  const [isInitialized, setIsInitialized] = useState(false);

  // ─── Handle Balance Update ──────────────────────────────────────
  const handleBalanceUpdate = useCallback((data: any) => {
    console.log('💰 Balance updated:', data);
    if (onBalanceChange) {
      onBalanceChange(data.balance);
    }

    // Log significant balance changes
    if (data.change && Math.abs(data.change) > 0) {
      log(
        ActivityActions.VIEW_TRANSACTIONS,
        `Balance ${data.change > 0 ? 'increased' : 'decreased'} by KES ${Math.abs(data.change).toLocaleString()}`
      );
    }
  }, [onBalanceChange, log, ActivityActions]);

  // ─── Handle Payment Update ──────────────────────────────────────
  const handlePaymentUpdate = useCallback((data: any) => {
    console.log('💳 Payment received:', data);
    
    // Check if payment is completed
    const isCompleted = data.payment?.status === 'COMPLETED' || 
                        data.payment?.status === 'SETTLED' ||
                        data.status === 'COMPLETED' ||
                        data.status === 'SETTLED';
    
    if (isCompleted) {
      // Set notification for toast
      setLastNotification({
        type: 'payment',
        title: '💰 New Payment Received!',
        message: `KES ${(data.payment?.amount || data.amount)?.toLocaleString()} received from ${data.payment?.phoneNumber || data.phoneNumber || 'customer'}`,
        data: data.payment || data
      });

      // Log the payment
      log(
        ActivityActions.VIEW_TRANSACTIONS,
        `Payment of KES ${(data.payment?.amount || data.amount)?.toLocaleString()} received`
      );

      if (onPaymentReceived) {
        onPaymentReceived(data.payment || data);
      }
    }
  }, [onPaymentReceived, log, ActivityActions]);

  // ─── Handle Transaction Update ──────────────────────────────────
  const handleTransactionUpdate = useCallback((data: any) => {
    console.log('📊 Transaction update:', data);
    
    if (data.transaction && onNewTransaction) {
      onNewTransaction(data.transaction);
    }
    
    // Show notification for new transactions
    if (data.transaction && data.transaction.status === 'COMPLETED') {
      setLastNotification({
        type: 'transaction',
        title: '📊 New Transaction',
        message: `KES ${data.transaction.amount?.toLocaleString()} transaction processed`,
        data: data.transaction
      });
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
    // You can update dashboard stats here
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
      setIsInitialized(true);
      log(
        ActivityActions.VIEW_DASHBOARD,
        `Dashboard WebSocket connected for ${merchantName}`
      );
    },
    onDisconnect: () => {
      console.log('❌ Dashboard WebSocket disconnected');
      setIsInitialized(false);
    },
    onError: (error) => {
      console.warn('⚠️ Dashboard WebSocket error:', error);
      // Don't show error to user if it's just a connection issue
      // The UI will show the connection status
    }
  });

  // ─── Retry connection if not connected after 5 seconds ──────────
  useEffect(() => {
    if (!ws.isConnected && !ws.isAvailable && merchantId) {
      const timer = setTimeout(() => {
        console.log('🔄 Retrying WebSocket connection...');
        ws.connect();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [ws.isConnected, ws.isAvailable, merchantId, ws.connect]);

  return {
    ...ws,
    lastNotification,
    clearNotification: () => setLastNotification(null),
    isInitialized
  };
}

export default useDashboardWebSocket;