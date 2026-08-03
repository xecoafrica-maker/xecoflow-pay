// src/hooks/useActivityLogger.ts
import { logActivity, ActivityActions } from '@/lib/activity-logger';

interface Merchant {
  merchant_id: number;
  email: string;
  business_name: string;
  settlement_phone: string;
  status: string;
}

export function useActivityLogger() {
  const log = async (action: string, details?: string) => {
    try {
      const merchantStr = localStorage.getItem('merchant');
      if (!merchantStr) {
        console.warn('⚠️ No merchant found in localStorage');
        return;
      }

      let merchant: Merchant;
      try {
        merchant = JSON.parse(merchantStr);
      } catch (e) {
        console.warn('⚠️ Failed to parse merchant from localStorage');
        return;
      }

      const merchantId = merchant.merchant_id;
      const email = merchant.email;

      if (!merchantId) {
        console.warn('⚠️ No merchant_id found');
        return;
      }

      if (!email) {
        console.warn('⚠️ No email found');
        return;
      }

      await logActivity({
        merchant_id: Number(merchantId),
        email: email,
        action: action,
        details: details,
      });
    } catch (error) {
      console.error('❌ Failed to log activity from hook:', error);
    }
  };

  return { log, ActivityActions };
}