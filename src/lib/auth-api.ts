// src/lib/auth-api.ts

// ─── Configuration ──────────────────────────────────────────────────
const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://xecoflow-2gen.onrender.com';

// ─── Types ──────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  country?: string;
  phone?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    merchantId: number;
    businessName: string;
    email: string;
    status: string;
    apiKey?: string;
    apiSecret?: string;
  };
  merchantId?: number;
  apiKey?: string;
  rawSecret?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  requiresOTP?: boolean;
  requiresVerification?: boolean;
  locked?: boolean;
  lock_until?: string;
  email?: string;
  message?: string;
  token?: string;
  refreshToken?: string;
  attempts_remaining?: number;
  merchant?: {
    merchantId: number;
    merchant_id?: number;
    businessName: string;
    business_name?: string;
    email: string;
    phone?: string;
    status?: string;
    settlementPhone?: string;
  };
}

export interface MerchantProfile {
  merchant_id: number;
  business_name: string;
  email: string;
  settlement_phone: string;
  status: string;
  created_at: string;
  phone?: string;
  business_type?: string;
  updated_at?: string;
  email_verified?: boolean;
  first_name?: string;
  last_name?: string;
  role?: string;
  country?: string;
  business_location?: string;
  business_registration_number?: string;
  settlement_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  vat_registered?: boolean;
  vat_number?: string;
  filing_preference?: 'auto' | 'manual';
  tax_agent_name?: string;
  tax_agent_pin?: string;
  directors?: Array<{
    id: string;
    fullName: string;
    idNumber: string;
    role: string;
  }>;
}

// ─── REGISTER ──────────────────────────────────────────────────────
export async function registerMerchant(data: RegisterRequest): Promise<RegisterResponse> {
  if (!data.email || !data.password || !data.businessName) {
    throw new Error('Email, password, and business name are required');
  }

  const payload = {
    email: data.email.trim(),
    password: data.password,
    businessName: data.businessName.trim(),
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    role: data.role || 'merchant',
    country: data.country || 'KE',
  };

  console.log('📤 Register request to:', AUTH_API_BASE + '/v1/auth/register');

  try {
    const res = await fetch(AUTH_API_BASE + '/v1/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const responseData = await res.json();
    console.log('📥 Register response:', responseData);
    
    if (!res.ok) {
      if (responseData.message && responseData.message.includes('settlement_phone')) {
        throw new Error('Settlement phone error. Please try again.');
      }
      if (responseData.message && responseData.message.includes('duplicate key')) {
        throw new Error('A merchant with this email already exists. Please login instead.');
      }
      throw new Error(responseData.message || 'Registration failed. Please try again.');
    }
    
    if (responseData.success && responseData.data) {
      return {
        success: true,
        message: responseData.message || 'Registration successful',
        data: {
          merchantId: responseData.data.merchantId,
          businessName: responseData.data.businessName,
          email: responseData.data.email,
          status: responseData.data.status,
          apiKey: responseData.data.apiKey,
          apiSecret: responseData.data.apiSecret
        },
        merchantId: responseData.data.merchantId,
        apiKey: responseData.data.apiKey,
        rawSecret: responseData.data.apiSecret
      };
    }
    
    return {
      success: true,
      message: responseData.message || 'Registration successful',
      merchantId: responseData.merchantId,
      apiKey: responseData.apiKey,
      rawSecret: responseData.rawSecret,
    };
  } catch (error: any) {
    console.error('❌ Register error:', error.message);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
}

// ─── LOGIN ──────────────────────────────────────────────────────────
export async function loginMerchant(data: LoginRequest): Promise<LoginResponse> {
  console.log('📤 Login request to:', AUTH_API_BASE + '/v1/auth/login');
  
  try {
    const res = await fetch(AUTH_API_BASE + '/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const responseData = await res.json();
    console.log('📥 Login response:', responseData);
    console.log('📥 Login status:', res.status);
    
    // ─── 401: Invalid credentials ──────────────────────────────────
    if (res.status === 401) {
      console.log('🔴 401 Unauthorized - Invalid credentials');
      let message = responseData.message || 'Invalid email or password';
      let attempts = responseData.attempts_remaining;
      console.log('📤 Returning 401 result - Message:', message, 'Attempts:', attempts);
      return {
        success: false,
        message: message,
        attempts_remaining: attempts
      };
    }
    
    // ─── 423: Account locked ──────────────────────────────────────
    if (res.status === 423) {
      console.log('🔴 423 Account locked');
      return {
        success: false,
        locked: true,
        message: responseData.message || 'Too many failed attempts. Please try again later.',
        lock_until: responseData.lock_until
      };
    }
    
    // ─── 403: Email not verified ──────────────────────────────────
    if (res.status === 403) {
      console.log('🔴 403 Email not verified');
      return {
        success: false,
        requiresVerification: true,
        message: responseData.message || 'Please verify your email before logging in.'
      };
    }
    
    // ─── Other errors ──────────────────────────────────────────────
    if (!res.ok) {
      console.log('🔴 Other error:', res.status);
      return {
        success: false,
        message: responseData.message || 'Login failed'
      };
    }
    
    // ─── Success ────────────────────────────────────────────────────
    if (responseData.success && responseData.data) {
      const data = responseData.data;
      console.log('✅ Login successful');
      return {
        success: true,
        token: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        merchant: {
          merchantId: data.merchantId,
          merchant_id: data.merchantId,
          businessName: data.businessName,
          business_name: data.businessName,
          email: data.email,
          phone: data.phone || '',
          settlementPhone: data.settlementPhone || data.phone || '',
          status: data.status,
        }
      };
    }
    
    // ─── Fallback success ──────────────────────────────────────────
    if (responseData.success) {
      const token = responseData.token || responseData.data?.token;
      const merchantData = responseData.merchant || responseData.data;
      return {
        success: true,
        token: token,
        merchant: {
          merchantId: merchantData?.merchantId || merchantData?.merchant_id,
          merchant_id: merchantData?.merchant_id || merchantData?.merchantId,
          businessName: merchantData?.businessName || merchantData?.business_name,
          business_name: merchantData?.business_name || merchantData?.businessName,
          email: merchantData?.email,
          phone: merchantData?.phone || '',
          settlementPhone: merchantData?.settlementPhone || merchantData?.phone || '',
          status: merchantData?.status || 'Active',
        }
      };
    }
    
    return {
      success: false,
      message: responseData.message || 'Login failed'
    };
  } catch (error) {
    console.error('❌ Login fetch error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.'
    };
  }
}

// ─── REFRESH TOKEN ──────────────────────────────────────────────────
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(AUTH_API_BASE + '/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to refresh token');
  }
  const data = await res.json();
  return data.data;
}

// ─── LOGOUT ──────────────────────────────────────────────────────────
export async function logoutMerchant(token: string): Promise<void> {
  await fetch(AUTH_API_BASE + '/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  });
}

// ─── GET MERCHANT PROFILE ──────────────────────────────────────────
export async function getMerchantProfile(token: string): Promise<MerchantProfile> {
  const res = await fetch(AUTH_API_BASE + '/v1/auth/account/details', {
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch profile');
  }
  const json = await res.json();
  console.log('📥 Profile response:', json);
  
  if (json.success && json.data) {
    return json.data;
  }
  if (json.merchant_id) {
    return json;
  }
  if (json.merchant) {
    return json.merchant;
  }
  if (json.data) {
    return json.data;
  }
  return json;
}

// ─── API CREDENTIALS ──────────────────────────────────────────────
export interface ApiCredentials {
  apiKey: string;
}

export interface RotateCredentialsResponse {
  message: string;
  apiKey: string;
  rawSecret: string;
}

export async function getApiCredentials(token: string): Promise<ApiCredentials> {
  const res = await fetch(AUTH_API_BASE + '/v1/keys/credentials', {
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch API credentials');
  }
  return res.json();
}

export async function rotateApiCredentials(token: string): Promise<RotateCredentialsResponse> {
  const res = await fetch(AUTH_API_BASE + '/v1/keys/credentials/rotate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to rotate API credentials');
  }
  return res.json();
}

export async function getApiSecret(token: string, password: string): Promise<{ secret: string }> {
  const res = await fetch(AUTH_API_BASE + '/v1/keys/secret', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to retrieve secret');
  }
  return res.json();
}