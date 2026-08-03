// src/app/api/log-ip/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  let ip = '';
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  }
  
  // If we still don't have an IP, try to get it from the request
  if (!ip) {
    // In Next.js 13+, you can get the IP from the request context
    // This is a fallback
    ip = request.headers.get('host') || '';
  }
  
  if (!ip) {
    ip = 'unknown';
  }
  
  return NextResponse.json({ ip });
}