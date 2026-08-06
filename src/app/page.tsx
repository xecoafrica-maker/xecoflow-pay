// src/app/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  // ── State for Developer Terminal Tabs ──
  const [activeTab, setActiveTab] = useState<'mpesa' | 'airtel' | 'card' | 'bank'>('mpesa');

  // ── Request examples for each tab ──
  const requestExamples = {
    mpesa: `{
  "intent": "collection",
  "currency": "KES",
  "amount": 7500.00,
  "source": {
    "type": "mpesa",
    "phone": "254712345678"
  },
  "metadata": {
    "referenceId": "inv_2026_8942"
  }
}`,
    airtel: `{
  "intent": "collection",
  "currency": "KES",
  "amount": 7500.00,
  "source": {
    "type": "airtel_money",
    "phone": "254712345678"
  },
  "metadata": {
    "referenceId": "inv_2026_8942"
  }
}`,
    card: `{
  "intent": "collection",
  "currency": "KES",
  "amount": 7500.00,
  "source": {
    "type": "card",
    "token": "tok_visa_1234"
  },
  "metadata": {
    "referenceId": "inv_2026_8942"
  }
}`,
    bank: `{
  "intent": "collection",
  "currency": "KES",
  "amount": 7500.00,
  "source": {
    "type": "pesalink",
    "bankCode": "KCB",
    "accountNumber": "1234567890"
  },
  "metadata": {
    "referenceId": "inv_2026_8942"
  }
}`
  };

  // ── Copy handler ──
  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="min-h-screen bg-white text-[#0a2540] selection:bg-[#635bff]/10 selection:text-[#635bff] antialiased">
      <Header />

      {/* ════════════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pb-32 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1350px] mx-auto px-8">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50/60 border border-indigo-100/80 rounded-full text-sm font-semibold text-[#635bff]">
                <span className="w-2 h-2 rounded-full bg-[#635bff] animate-pulse" />
                Live across East Africa — 8+ payment networks
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#0a2540] leading-[1.02]">
                Payments infrastructure <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent">
                  built for Africa
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed font-normal">
                XecoFlow helps businesses accept payments through M-PESA, Airtel Money, Visa, Mastercard, and bank transfers with a single integration. Scale across Africa with reliable payment processing, automated settlements, and enterprise-grade security.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link 
                  href="/login" 
                  className="px-7 py-4 bg-[#635bff] hover:bg-[#534bd6] text-white rounded-xl font-semibold text-[16px] transition-all duration-150 shadow-lg shadow-indigo-600/10 flex items-center gap-2 group"
                >
                  Start accepting payments
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link 
                  href="#sales" 
                  className="px-7 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-[16px] transition-all duration-150 hover:bg-gray-50"
                >
                  Contact sales
                </Link>
              </div>
            </div>

            {/* Right Column – Circular Image with Logos */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end relative px-4 sm:px-8">
              <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center">
                
                <div className="relative w-[95%] h-[95%] rounded-full overflow-hidden shadow-2xl border-[6px] border-gray-100 bg-gray-50 group">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 z-10" />
                  <img 
                    src="https://wemabank.com/assets/left-dynFrDfB.png" 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                </div>

                {/* Payment Logos on Circle Edge */}
                <div className="absolute top-[1.5%] left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex flex-col items-center justify-center transition-transform hover:scale-110">
                    <span className="text-yellow-600 font-black text-xs leading-none">MTN</span>
                    <span className="text-yellow-600 font-bold text-[9px]">MoMo</span>
                  </div>
                </div>

                <div className="absolute top-[12%] right-[12%] z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex flex-col items-center justify-center transition-transform hover:scale-110">
                    <span className="text-red-600 font-extrabold text-xs leading-none">airtel</span>
                    <span className="text-red-600 font-normal text-[8px]">money</span>
                  </div>
                </div>

                <div className="absolute top-1/2 right-[1.5%] -translate-y-1/2 z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex flex-col items-center justify-center transition-transform hover:scale-110">
                    <div className="w-4 h-2 border-t-2 border-x-2 border-amber-800 rounded-t-sm mb-0.5" />
                    <span className="text-[#7A2021] font-black text-[10px] tracking-wider">EQUITY</span>
                  </div>
                </div>

                <div className="absolute bottom-[12%] right-[12%] z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex items-center justify-center gap-0.5 transition-transform hover:scale-110">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-90 translate-x-1" />
                    <div className="w-4 h-4 rounded-full bg-amber-500 opacity-90 -translate-x-1" />
                  </div>
                </div>

                <div className="absolute bottom-[1.5%] left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex items-center justify-center transition-transform hover:scale-110">
                    <span className="text-blue-800 font-extrabold text-[15px] tracking-tight">VISA</span>
                  </div>
                </div>

                <div className="absolute bottom-[12%] left-[12%] z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex items-center justify-center transition-transform hover:scale-110">
                    <span className="text-blue-900 font-black text-[11px] italic tracking-tight">PesaLink</span>
                  </div>
                </div>

                <div className="absolute top-1/2 left-[1.5%] -translate-y-1/2 z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex flex-col items-center justify-center transition-transform hover:scale-110">
                    <span className="text-blue-700 font-black text-xs leading-none">Tigo</span>
                    <span className="text-blue-700 font-bold text-[8px]">Pesa</span>
                  </div>
                </div>

                <div className="absolute top-[12%] left-[12%] z-20">
                  <div className="bg-white rounded-full shadow-xl border border-gray-100/80 w-[4.5rem] h-[4.5rem] flex items-center justify-center transition-transform hover:scale-110">
                    <span className="text-[#009A49] font-black text-[14px] tracking-tighter">M-PESA</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TRUSTED BY - ANIMATED SCROLLING LOGOS
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-10 overflow-hidden">
        <div className="max-w-[1350px] mx-auto px-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 text-center">
            Powering enterprise commerce across East Africa
          </p>
          
          {/* Scrolling logos container - Right to Left */}
          <div className="relative">
            <div className="flex animate-scroll-right-to-left gap-12 md:gap-16 items-center">
              {/* First set */}
              <div className="flex items-center gap-12 md:gap-16 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Safaricom</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Enashipai Resort</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Speke Resort</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">K</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">KCB Bank</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Equity Bank</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">N</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Nairobi Hospital</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">M</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">M-KOPA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">T</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Twiga Foods</span>
                </div>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex items-center gap-12 md:gap-16 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Safaricom</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Enashipai Resort</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Speke Resort</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">K</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">KCB Bank</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Equity Bank</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">N</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Nairobi Hospital</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">M</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">M-KOPA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">T</div>
                  <span className="font-bold text-gray-700 text-base whitespace-nowrap">Twiga Foods</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add the animation CSS */}
      <style jsx>{`
        @keyframes scroll-right-to-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-right-to-left {
          animation: scroll-right-to-left 25s linear infinite;
          width: fit-content;
        }
        .animate-scroll-right-to-left:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════
          PRODUCTS
          ════════════════════════════════════════════════════════════════ */}
      <section id="products" className="py-24 bg-gray-50/40 border-b border-gray-100">
        <div className="max-w-[1350px] mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0a2540]">
              Accept every payment method. <br />
              Through a single API.
            </h2>
            <p className="text-lg text-gray-500 font-normal leading-relaxed">
              Access M-PESA, Airtel Money, Visa, Mastercard, and bank transfers through a unified API designed for reliability, scale, and enterprise-grade performance.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'M-PESA Direct', desc: 'Complete integration loop covering STK Push alerts, dynamic C2B ledgers, and automated B2C payout queries.', accent: 'group-hover:border-emerald-500' },
              { name: 'Airtel Money Core', desc: 'Secure high-performance API endpoint to clear Airtel currency collections directly into business wallets.', accent: 'group-hover:border-red-500' },
              { name: 'Visa & Mastercard', desc: 'Accept tokenized processing lines for standard global debit and credit lines seamlessly.', accent: 'group-hover:border-blue-500' },
              { name: 'PayPal Link Gateway', desc: 'Enable cross-border transfers and checkout hooks tailored cleanly for international client accounts.', accent: 'group-hover:border-indigo-500' },
              { name: 'Stripe Global Pass', desc: 'Synchronize international banking layers and currency management protocols off the shelf.', accent: 'group-hover:border-violet-500' },
              { name: 'Flutterwave Connect', desc: 'Access Pan-African banking layers and sub-regional clearing networks instantly.', accent: 'group-hover:border-orange-500' },
              { name: 'Bank Cleared RTGS', desc: 'Process structured PesaLink triggers, real-time EFT runs, and electronic banking wire maps.', accent: 'group-hover:border-teal-500' },
              { name: 'SACCO Ledger Sync', desc: 'Specialized cooperative endpoints designed to audit member capital contributions efficiently.', accent: 'group-hover:border-amber-500' },
            ].map((p, idx) => (
              <div key={p.name} className="group bg-white border border-gray-200/70 p-6 rounded-2xl hover:shadow-xl hover:shadow-gray-900/[0.02] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 border-t border-transparent ${p.accent} transition-colors duration-200`} />
                <div className="space-y-4">
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center font-mono text-xs text-gray-400 font-bold border border-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-[#0a2540] text-[16px] tracking-tight">{p.name}</h3>
                  <p className="text-[13.5px] text-gray-400 font-normal leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DEVELOPERS – Terminal with scrollable content
          ════════════════════════════════════════════════════════════════ */}
      <section id="developers" className="py-24 relative">
        <div className="max-w-[1350px] mx-auto px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0a2540] leading-tight">
                Integrate once. Accept payments everywhere.
              </h2>
              <p className="text-base text-gray-500 leading-relaxed">
                Integrate mobile money, card payments, and bank transfers through a single API. Eliminate the complexity of managing multiple providers and launch faster with powerful tools, clear documentation, and enterprise-grade security.
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="/login" className="px-5 py-3 bg-[#635bff] hover:bg-[#534bd6] text-white rounded-xl font-semibold text-sm transition-colors">
                  Generate API Keys
                </Link>
                <a href="#" className="px-5 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl font-semibold text-sm transition-colors">
                  View Documentation
                </a>
              </div>
            </div>

            {/* Terminal Block */}
            <div className="lg:col-span-7 w-full">
              <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] shadow-2xl p-6 font-mono text-[13px] text-gray-300 relative overflow-hidden">

                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444]/80 block" />
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 block" />
                    <span className="w-3 h-3 rounded-full bg-[#10b981]/80 block" />
                    <span className="text-xs text-gray-500 font-medium ml-2">POST /v1/charges/initialize</span>
                  </div>
                  <span className="text-[11px] text-gray-600">Bearer Token Enabled</span>
                </div>

                <div className="flex gap-2 mb-4 border-b border-white/[0.06] pb-2">
                  {[
                    { key: 'mpesa', label: 'M-PESA' },
                    { key: 'airtel', label: 'Airtel Money' },
                    { key: 'card', label: 'Card' },
                    { key: 'bank', label: 'Bank Transfer' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        activeTab === tab.key
                          ? 'bg-white/10 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-2">
                  <div className="relative">
                    <pre className="text-white/90 leading-relaxed overflow-x-auto whitespace-pre-wrap text-[13px]">
                      {requestExamples[activeTab]}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(requestExamples[activeTab])}
                      className="absolute top-0 right-0 text-gray-500 hover:text-white transition-colors text-xs bg-[#0b1220]/80 px-2 py-1 rounded"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4 mt-4">
                    <p className="text-gray-500 text-xs mb-2">// Server Response status 201 Created</p>
                    <pre className="text-emerald-400/90 leading-relaxed overflow-x-auto">
{`{
  "status": "processing_awaiting_pin",
  "transactionToken": "xco_tok_8f934ha019f82m34la",
  "clientInstruction": "STK Push triggered payload package"
}`}
                    </pre>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4 mt-4">
                    <p className="text-gray-500 text-xs mb-2">// Webhook (payment.completed) – sent to your callback URL</p>
                    <pre className="text-blue-300/80 leading-relaxed overflow-x-auto text-[12px]">
{`{
  "event": "payment.completed",
  "transactionToken": "xco_tok_8f934ha019f82m34la",
  "amount": 7500.00,
  "currency": "KES",
  "status": "success",
  "settlementReference": "SET-2026-001234",
  "settlementDate": "2026-06-25T14:30:00Z"
}`}
                    </pre>
                  </div>

                  <div className="flex gap-3 mt-4 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => copyToClipboard(requestExamples[activeTab])}
                      className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                    >
                      📋 Copy Request
                    </button>
                    <a
                      href="#"
                      className="text-xs bg-[#635bff]/20 hover:bg-[#635bff]/30 text-[#635bff] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                    >
                      🚀 Try in Sandbox
                    </a>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0b1220] to-transparent pointer-events-none" />
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA – Clean and Simple
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 bg-white text-center border-t border-gray-100">
        <div className="max-w-[1350px] mx-auto px-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0a2540]">
              Ready to start accepting payments?
            </h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto font-normal leading-relaxed">
              Accept mobile money, cards, and bank transfers through a single integration. Create your account and start building today.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#635bff] hover:bg-[#534bd6] text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold text-base transition-all hover:bg-gray-50"
              >
                Book Demo
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400 pt-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                No setup fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Pay-as-you-go pricing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Free sandbox environment
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}