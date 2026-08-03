// src/lib/payment-handler.ts
import crypto from 'crypto';

export interface PaymentCredentials {
  apiKey: string;
  apiSecret: string;
  merchantId: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    transactionId: string;
    checkoutRequestId: string;
  };
  error?: string;
  correlationId?: string;
}

export const generateSignature = (secret: string, body: Record<string, unknown>): string => {
  const sorted: Record<string, unknown> = {};
  Object.keys(body).sort().forEach((key) => {
    sorted[key] = body[key];
  });
  const bodyString = JSON.stringify(sorted);
  return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
};

export const processPayment = async (
  credentials: PaymentCredentials,
  paymentData: {
    phone: string;
    amount: number;
    method?: string;
    action?: string;
    shortcode?: string;
    transactionDesc?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<PaymentResponse> => {
  const { apiKey, apiSecret, merchantId } = credentials;

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const idempotencyKey = 'key-' + crypto.randomBytes(8).toString('hex');

  const body = {
    action: paymentData.action || 'charge',
    method: paymentData.method || 'mpesa',
    phone: paymentData.phone,
    amount: Number(paymentData.amount),
    shortcode: paymentData.shortcode || merchantId,
    idempotencyKey: idempotencyKey,
    transactionDesc: paymentData.transactionDesc || 'Payment',
    metadata: paymentData.metadata || {},
  };

  const signature = generateSignature(apiSecret, body as unknown as Record<string, unknown>);

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-signature': signature,
    'x-timestamp': String(timestamp),
    'x-nonce': nonce,
  };

  try {
    // ✅ Use a CORS proxy to bypass CORS
    // Remove this proxy in production and use your own server
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://xecofLow-2gen.onrender.com/v1/payments';
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Payment failed' };
    }

    return { success: true, data: data.data, correlationId: data.correlationId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};