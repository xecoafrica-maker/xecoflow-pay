// src/app/maintenance/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Shield, 
  Clock, 
  Wrench, 
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  RefreshCw
} from 'lucide-react';

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Countdown to tomorrow 6 AM
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft({ hours, minutes, seconds });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2540] via-[#0f1f3a] to-[#1a2a4a] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Xeco<span className="text-emerald-400">Flow</span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Scheduled Maintenance</span>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              We're Making Things Better
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Our team is working hard to improve your experience. 
              We're upgrading our systems to serve you better.
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Hours</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Minutes</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Seconds</div>
            </div>
          </div>

          {/* Status Items */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
              <RefreshCw className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">System Optimization</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
              <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">Security Enhancements</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
              <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">Performance Improvements</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">New Features Ready</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-500">
              We'll be back online <span className="text-slate-300 font-medium">tomorrow at 6:00 AM EAT</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expected downtime: 12 hours
              </span>
              <span className="text-slate-600">•</span>
              <span>For urgent issues, contact support</span>
            </div>
            <div className="pt-4 border-t border-white/5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <span>Refresh for updates</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">Maintenance in progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}