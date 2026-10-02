// src/app/dashboard/loans/landing/page.tsx
'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Award,
  Smartphone,
} from 'lucide-react';

export default function LoanLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-200">XecoFlow Lending</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Africa's AI-Powered
                <span className="block text-blue-200">SME Lending Platform</span>
              </h1>
              
              <p className="text-lg text-blue-100 mb-8 max-w-lg">
                We connect MSMEs to working capital — instantly, fairly, and at scale. 
                No collateral. No hidden fees. Instant credit decisions.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard/loans/apply"
                  className="px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                >
                  Apply Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  GET IT ON Google Play
                </button>
              </div>

              <div className="flex items-center gap-6 mt-8 text-sm text-blue-200">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-300" />
                  Secured
                </span>
                <span className="w-px h-4 bg-blue-400/30" />
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  Quick Approval
                </span>
                <span className="w-px h-4 bg-blue-400/30" />
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-300" />
                  Best Rates
                </span>
              </div>
            </div>

            {/* Right Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">$45M+</p>
                <p className="text-sm text-blue-200 mt-1">CAPITAL DEPLOYED</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">400,000+</p>
                <p className="text-sm text-blue-200 mt-1">LOANS DISBURSED</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">1M+</p>
                <p className="text-sm text-blue-200 mt-1">SMES SCORED</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">300M+</p>
                <p className="text-sm text-blue-200 mt-1">DATA POINTS ANALYSED</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}