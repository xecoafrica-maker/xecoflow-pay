// src/app/pos/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  Smartphone,
  Wifi,
  Store,
  CreditCard,
  Check,
  Receipt,
  BarChart3,
  Search,
  User,
} from 'lucide-react';

export default function POSPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    const run = () => {
      setStep(0);
      timers.push(setTimeout(() => setStep(1), 600));
      timers.push(setTimeout(() => setStep(2), 2400));
      timers.push(setTimeout(() => setStep(3), 4200));
      timers.push(setTimeout(() => setStep(4), 6200));
      timers.push(setTimeout(run, 9500));
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0a2540] antialiased">
      <Header />

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#f8f9fc]" />
        <div className="absolute bottom-0 right-0 w-[65%] h-[55%] bg-gradient-to-tl from-emerald-200/30 via-teal-100/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            
            {/* LEFT */}
            <div className="space-y-5 max-w-lg">
              <h1 className="text-[40px] sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540]">
                Collect in-person &<br />
                over-the-counter payments
              </h1>

              <p className="text-[16px] text-gray-600 leading-relaxed">
                Accept M-PESA, cards, and cash at the counter. Built for supermarkets, retail shops, pharmacies, and service businesses across East Africa — fast, reliable, and offline-ready.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
                >
                  Get Xeco POS
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT – Desktop POS monitor */}
            <div className="relative w-full max-w-[480px] mx-auto lg:ml-auto">
              {/* Monitor frame */}
              <div className="bg-[#1a1a2e] rounded-t-xl p-2.5 shadow-2xl">
                {/* Screen */}
                <div className="bg-[#f0f2f5] rounded-lg overflow-hidden min-h-[340px]">
                  
                  {/* Top bar – cashier app chrome */}
                  <div className="bg-[#0a2540] text-white px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold tracking-tight">Xeco POS</span>
                      <span className="text-[10px] text-white/40">|</span>
                      <span className="text-[11px] text-white/60">Till 3 — GreenMart Westlands</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Online</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-white/50" />
                        <span className="text-[10px] text-white/60">Joyce K.</span>
                      </div>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="flex min-h-[300px]">
                    
                    {/* Left panel – cart / items */}
                    <div className="flex-1 p-3 border-r border-gray-200">
                      {/* Search bar */}
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mb-3">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] text-gray-400">Scan barcode or search item…</span>
                      </div>

                      {/* Cart items */}
                      <div className="space-y-1.5">
                        {[
                          { name: 'Cooking Oil 2L', qty: 2, price: '1,200', code: '88421' },
                          { name: 'Maize Flour 2kg', qty: 3, price: '1,050', code: '33102' },
                          { name: 'Milk 500ml', qty: 4, price: '800', code: '55210' },
                          { name: 'White Bread', qty: 2, price: '300', code: '11045' },
                          { name: 'Sugar 1kg', qty: 1, price: '250', code: '22018' },
                        ].map((item, i) => (
                          <div
                            key={item.code}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] ${
                              step >= 1 && i === 4 ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] text-gray-400 font-mono w-10 shrink-0">{item.code}</span>
                              <span className="text-gray-700 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              <span className="text-gray-400">×{item.qty}</span>
                              <span className="font-medium text-gray-800 w-14 text-right">KES {item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right panel – totals + payment */}
                    <div className="w-[160px] p-3 bg-white flex flex-col">
                      <div className="mb-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order</p>
                        <p className="text-[12px] font-mono text-gray-500">#4821</p>
                      </div>

                      <div className="space-y-1 text-[11px] mb-3">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span>3,600</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Tax (16%)</span>
                          <span>576</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Items</span>
                          <span>12</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-2 mb-4">
                        <p className="text-[10px] text-gray-400">Total</p>
                        <p className="text-xl font-bold text-[#0a2540]">KES 4,176</p>
                      </div>

                      {/* Payment actions by step */}
                      {step <= 1 && (
                        <button className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg text-[12px] font-semibold mt-auto">
                          Charge
                        </button>
                      )}

                      {step === 2 && (
                        <div className="space-y-1.5 mt-auto animate-in fade-in duration-300">
                          <button className="w-full py-2 rounded-lg text-[11px] font-semibold border-2 border-[#009A49] bg-[#009A49]/10 text-[#009A49]">
                            M-PESA
                          </button>
                          <button className="w-full py-2 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-600">
                            Card
                          </button>
                          <button className="w-full py-2 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-600">
                            Cash
                          </button>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="mt-auto text-center animate-in fade-in duration-300">
                          <svg className="animate-spin h-6 w-6 text-[#009A49] mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <p className="text-[11px] font-medium text-gray-600">Waiting for M-PESA…</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">2547•• ••5678</p>
                        </div>
                      )}

                      {step === 4 && (
                        <div className="mt-auto text-center animate-in fade-in duration-300">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Check className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-[12px] font-bold text-[#0a2540]">Paid</p>
                          <p className="text-[10px] text-gray-500">M-PESA • QK7X2M9P</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor stand */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-3 bg-[#1a1a2e] rounded-b-sm" />
                <div className="w-28 h-2 bg-[#2a2a3e] rounded-b-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────── */}
      <section className="pt-10 pb-20 bg-white border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
              Built for the counter
            </h2>
            <p className="text-lg text-gray-500">
              Everything your supermarket, shop, or service business needs to collect payments in person — quickly and reliably.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: 'M-PESA STK Push',
                desc: 'Send a payment request to the customer’s phone. They enter their PIN and you’re paid in seconds.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: <CreditCard className="w-5 h-5" />,
                title: 'Card payments',
                desc: 'Accept Visa and Mastercard at the till with optional card reader support.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: <Store className="w-5 h-5" />,
                title: 'Multi-till ready',
                desc: 'Run several counters under one business account. Track sales per till and per cashier.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: <Wifi className="w-5 h-5" />,
                title: 'Works offline',
                desc: 'Queue transactions when the network drops. They sync automatically when you’re back online.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: <Receipt className="w-5 h-5" />,
                title: 'Instant receipts',
                desc: 'Print or SMS a receipt to the customer the moment payment is confirmed.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: 'Sales reports',
                desc: 'See daily totals, payment method breakdown, and till performance in real time.',
                color: 'bg-teal-50 text-teal-600',
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-[16px] font-bold text-[#0a2540] mb-1.5">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT’S FOR ───────────────────────────────────────────── */}
      <section className="py-20 bg-[#f8f9fa] border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
              Made for every kind of counter
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Supermarkets', desc: 'Multi-till, high volume, barcode-friendly' },
              { title: 'Retail shops', desc: 'Quick checkout for fashion, electronics, general trade' },
              { title: 'Pharmacies', desc: 'Secure payments with itemized receipts' },
              { title: 'Service desks', desc: 'Salons, clinics, bill payment points' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <div className="w-11 h-11 rounded-xl bg-[#635bff]/10 text-[#635bff] flex items-center justify-center mx-auto mb-3">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-bold text-[#0a2540] mb-1">{item.title}</h3>
                <p className="text-[13px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">
            Ready to equip your counters?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start accepting in-person payments with Xeco POS. Free sandbox, no long-term contracts.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0a2540] hover:bg-[#1a365d] text-white font-semibold transition-colors"
          >
            Get Xeco POS
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}