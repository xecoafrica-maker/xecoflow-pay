// src/lib/captcha.ts

export type CaptchaProvider = 'hcaptcha' | 'recaptcha' | 'turnstile';

interface CaptchaConfig {
  provider: CaptchaProvider;
  secretKey: string;
  verifyUrl: string;
}

function getCaptchaConfig(): CaptchaConfig {
  const provider = (process.env.CAPTCHA_PROVIDER || 'turnstile') as CaptchaProvider;
  
  const configs: Record<CaptchaProvider, CaptchaConfig> = {
    turnstile: {
      provider: 'turnstile',
      secretKey: process.env.CAPTCHA_SECRET_KEY || '',
      verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    },
    hcaptcha: {
      provider: 'hcaptcha',
      secretKey: process.env.HCAPTCHA_SECRET_KEY || '',
      verifyUrl: 'https://hcaptcha.com/siteverify',
    },
    recaptcha: {
      provider: 'recaptcha',
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
      verifyUrl: 'https://www.google.com/recaptcha/api/siteverify',
    },
  };

  return configs[provider];
}

/**
 * Verify a CAPTCHA token
 * Supports: Cloudflare Turnstile, hCaptcha, reCAPTCHA v3
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  // Skip CAPTCHA verification in development and test environments
  const isDev = process.env.NODE_ENV && ['development', 'test'].includes(process.env.NODE_ENV);
  
  if (isDev) {
    console.log('🔓 [CAPTCHA] Skipping verification (development mode)');
    return true;
  }

  if (!token) {
    console.warn('⚠️ [CAPTCHA] No token provided');
    return false;
  }

  try {
    const config = getCaptchaConfig();
    
    if (!config.secretKey) {
      console.warn(`⚠️ [CAPTCHA] Secret key not set for ${config.provider}`);
      return false;
    }

    const response = await fetch(config.verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [CAPTCHA] Verification successful (${config.provider})`);
    } else {
      const errorCodes = data['error-codes'] || data['error-codes'] || [];
      console.warn(`❌ [CAPTCHA] Verification failed:`, errorCodes);
    }
    
    return data.success === true;
  } catch (error) {
    console.error('❌ [CAPTCHA] Verification error:', error);
    // Fail closed in production - security first!
    return false;
  }
}

// Get CAPTCHA site key for frontend
export function getCaptchaSiteKey(): string {
  const provider = process.env.CAPTCHA_PROVIDER || 'turnstile';
  
  const keys: Record<string, string> = {
    turnstile: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    hcaptcha: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '',
    recaptcha: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  };

  return keys[provider] || '';
}

// Get CAPTCHA script URL for frontend
export function getCaptchaScriptUrl(): string {
  const provider = process.env.CAPTCHA_PROVIDER || 'turnstile';
  
  const urls: Record<string, string> = {
    turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
    hcaptcha: 'https://js.hcaptcha.com/1/api.js',
    recaptcha: 'https://www.google.com/recaptcha/api.js',
  };

  return urls[provider] || '';
}