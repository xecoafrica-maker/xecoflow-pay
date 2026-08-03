// src/lib/activity-logger.ts
import { createClient } from '@supabase/supabase-js';

// ─── Using env vars ──────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface ActivityLog {
  merchant_id: number;
  email: string;
  action: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Get Browser Geolocation ──────────────────────────────────────
async function getBrowserLocation(): Promise<{ city: string; country: string; location: string; latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city and country
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.city || data.locality || 'Unknown';
            const country = data.countryName || 'Unknown';
            const location = `${city}, ${country}`;
            
            resolve({
              city,
              country,
              location,
              latitude,
              longitude
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
          resolve(null);
        }
      },
      () => {
        // User denied or geolocation failed
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// ─── Get Client IP Address ──────────────────────────────────────────
async function getClientIP(): Promise<string> {
  try {
    const services = [
      'https://api.ipify.org?format=json',
      'https://api.my-ip.io/ip.json',
      'https://ipapi.co/json/'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service, { 
          signal: AbortSignal.timeout(3000),
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ip) return data.ip;
          if (data.ip_address) return data.ip_address;
          if (data.query) return data.query;
          if (typeof data === 'string') return data;
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return '';
  }
}

// ─── Get User Agent ──────────────────────────────────────────────────
function getUserAgent(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent || '';
  }
  return '';
}

// ─── Get Location from IP (Fallback) ──────────────────────────────
async function getLocationFromIP(ip: string): Promise<{ city: string; country: string; location: string } | null> {
  try {
    if (!ip || ip === 'unknown' || ip === '') {
      return null;
    }

    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.city || data.country_name) {
        const city = data.city || 'Unknown City';
        const country = data.country_name || data.country || 'Unknown Country';
        return {
          city,
          country,
          location: `${city}, ${country}`
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function logActivity(data: ActivityLog) {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured. Activity log not saved.');
      return;
    }

    if (!data.merchant_id || !data.email || !data.action) {
      console.warn('⚠️ Missing required fields');
      return;
    }

    // Get IP address
    let ipAddress = data.ip_address || '';
    if (!ipAddress && typeof window !== 'undefined') {
      ipAddress = await getClientIP();
    }

    // Try to get accurate location from browser geolocation first
    let location = data.location || '';
    let city = data.city || '';
    let country = data.country || '';
    let latitude = data.latitude || 0;
    let longitude = data.longitude || 0;
    
    if (typeof window !== 'undefined' && !location) {
      const browserLocation = await getBrowserLocation();
      if (browserLocation) {
        city = browserLocation.city;
        country = browserLocation.country;
        location = browserLocation.location;
        latitude = browserLocation.latitude;
        longitude = browserLocation.longitude;
        console.log('📍 Accurate location from browser:', location);
      }
    }
    
    // Fallback to IP-based location if browser geolocation failed
    if (!location && ipAddress) {
      const ipLocation = await getLocationFromIP(ipAddress);
      if (ipLocation) {
        city = ipLocation.city;
        country = ipLocation.country;
        location = ipLocation.location;
        console.log('📍 Location from IP (fallback):', location);
      }
    }

    const userAgent = data.user_agent || getUserAgent();

    // Build details with location and coordinates
    let details = data.details || '';
    if (location && !details.includes(location)) {
      details = `${details} (Location: ${location}`;
      if (latitude && longitude) {
        details += `, 📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      details += ')';
    }

    console.log('📝 Logging activity:', {
      merchant_id: data.merchant_id,
      email: data.email,
      action: data.action,
      details: details,
      ip_address: ipAddress || 'Not available',
      location: location || 'Not available'
    });

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        merchant_id: Number(data.merchant_id),
        email: data.email,
        action: data.action,
        details: details,
        ip_address: ipAddress || '',
        user_agent: userAgent,
      });

    if (error) {
      console.error('❌ Error logging activity:', error);
    } else {
      console.log('✅ Activity logged successfully');
    }
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
  }
}

// ─── Pre-defined Activity Types ──────────────────────────────────
export const ActivityActions = {
  LOGIN: 'User logged in',
  LOGOUT: 'User logged out',
  REGISTER: 'User registered',
  PASSWORD_CHANGE: 'Password changed',
  PASSWORD_RESET: 'Password reset requested',
  VIEW_DASHBOARD: 'Viewed dashboard',
  VIEW_ACTIVITY_LOGS: 'Viewed activity logs',
  VIEW_TRANSACTIONS: 'Viewed transactions',
  VIEW_INFLOW: 'Viewed inflow transactions',
  VIEW_OUTFLOW: 'Viewed outflow transactions',
  VIEW_WALLET: 'Viewed wallet transactions',
  GENERATE_STATEMENT: 'Generated statement',
  VIEW_WITHDRAW_HISTORY: 'Viewed withdraw history',
  VIEW_WITHDRAW_SCHEDULES: 'Viewed withdraw schedules',
  CREATE_WITHDRAWAL: 'Created withdrawal',
  SCHEDULE_WITHDRAWAL: 'Scheduled withdrawal',
  ADD_BENEFICIARY: 'Added a beneficiary',
  VIEW_BENEFICIARIES: 'Viewed beneficiaries',
  DELETE_BENEFICIARY: 'Deleted beneficiary',
  VIEW_BUSINESS_IDENTITY: 'Viewed business identity',
  UPDATE_BUSINESS_IDENTITY: 'Updated business identity',
  VIEW_TEAM: 'Viewed team management',
  ADD_TEAM_MEMBER: 'Added team member',
  REMOVE_TEAM_MEMBER: 'Removed team member',
  VIEW_PROFILE: 'Viewed profile',
  UPDATE_PROFILE: 'Updated profile',
  VIEW_SECURITY: 'Viewed security settings',
  UPDATE_SECURITY: 'Updated security settings',
  VIEW_API_KEYS: 'Viewed API keys',
  CREATE_API_KEY: 'Created API key',
  DELETE_API_KEY: 'Deleted API key',
  VIEW_APPS: 'Viewed apps & services',
  PIN_APP: 'Pinned app to sidebar',
  UNPIN_APP: 'Unpinned app from sidebar',
  POS_PAYMENT: 'POS payment processed',
  POS_PRINT_RECEIPT: 'POS receipt printed',
  
  // ✅ ADDED NEW ACTIONS FOR BILLS
  VIEW_BILLS: 'Viewed smart bills',
  CREATE_BILL: 'Created a smart bill',
  VIEW_BILL_DETAILS: 'Viewed bill details',
  RESEND_BILL: 'Resent bill to customer',
  DOWNLOAD_BILL_PDF: 'Downloaded bill PDF',
};