'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles, ArrowRight, Award, Clock, Menu } from 'lucide-react';

export default function LoanLandingPage() {
  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-slate-50 min-h-screen flex items-center">
      {/* Floating Menu Button */}
      <button
        onClick={goToDashboard}
        className="fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 text-gray-700 cursor-pointer"
        aria-label="Go to Dashboard"
      >
        <Menu className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Back to Menu</span>
      </button>

      {/* Background Animations */}
      <div className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[600px] w-[600px] rounded-full bg-emerald-100/40 blur-3xl animate-pulse" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-50/60 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 w-full">
        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* LEFT CONTENT */}
          <div>
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 backdrop-blur-sm px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-emerald-700">
                IMARA CREDIT
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900">
              Grow Your Business with Imara Credit
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Instant SME Loans
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Get unsecured business financing from <span className="font-bold text-emerald-700">KES 5,000</span> to{' '}
              <span className="font-bold text-emerald-700">KES 5,000,000</span> with instant AI-powered 
              credit decisions, transparent pricing, and no hidden fees.
            </p>

            {/* Key Features */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-100">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Up to KES 5M</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Instant Decisions</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-9 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Apply Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>

              <Link
                href="#"
                className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md flex items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <span className="text-emerald-600">✦</span>
                  Learn More
                </span>
              </Link>
            </div>

            {/* Trust line */}
            <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Regulated lending partner · bank-grade data security</span>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="overflow-hidden rounded-[28px] shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/50">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa9gvZENqUAEMI-dq5II4eEkcfsTNp-mSNqHxMVnXUPEgSFf6sJurL-7s&s=10"
                  alt="Small business loan application"
                  width={560}
                  height={620}
                  className="h-[560px] w-[480px] object-cover"
                />
              </div>

              {/* Floating credibility cards */}
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-100 bg-white/90 backdrop-blur-sm px-6 py-4 shadow-xl shadow-slate-900/10 sm:block">
                <p className="text-2xl font-bold text-emerald-700">KES 5M</p>
                <p className="text-xs font-medium tracking-wide text-slate-500">
                  MAXIMUM LOAN AMOUNT
                </p>
              </div>

              <div className="absolute -top-6 -right-6 hidden rounded-2xl border border-slate-100 bg-white/90 backdrop-blur-sm px-6 py-4 shadow-xl shadow-slate-900/10 sm:block">
                <p className="text-2xl font-bold text-emerald-700">AI-Powered</p>
                <p className="text-xs font-medium tracking-wide text-slate-500">
                  INSTANT CREDIT DECISIONS
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}