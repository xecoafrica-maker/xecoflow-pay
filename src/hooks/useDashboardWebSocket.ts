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

    // Log significant balance changes using VIEW_TRANSACTIONS action
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
    
    // Play notification sound if payment completed
    if (data.payment?.status === 'COMPLETED' || data.payment?.status === 'SETTLED') {
      // Optional: Play sound
      // playNotificationSound();
      
      // Set notification for toast
      setLastNotification({
        type: 'payment',
        title: 'New Payment Received! 🎉',
        message: `KES ${data.payment?.amount?.toLocaleString()} received from ${data.payment?.phoneNumber || 'customer'}`,
        data: data.payment
      });

      // Log the payment using VIEW_TRANSACTIONS action
      log(
        ActivityActions.VIEW_TRANSACTIONS,
        `Payment of KES ${data.payment?.amount?.toLocaleString()} received from ${data.payment?.phoneNumber || 'customer'}`
      );

      if (onPaymentReceived) {
        onPaymentReceived(data.payment);
      }
    }
  }, [onPaymentReceived, log, ActivityActions]);

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
      // Log connection using VIEW_DASHBOARD action
      log(
        ActivityActions.VIEW_DASHBOARD,
        `Dashboard WebSocket connected for ${merchantName}`
      );
    }
  });

  return {
    ...ws,
    lastNotification,
    clearNotification: () => setLastNotification(null)
  };
}

export default useDashboardWebSocket;