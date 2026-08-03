// src/app/invoicing/page.tsx
// or src/landing/Headers/Products/Invoicing.tsx

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  FileText,
  Zap,
  Smartphone,
  ShieldCheck,
  Mail,
  Check,
  Clock,
  Bell,
  CreditCard,
} from 'lucide-react';

export default function InvoicingPage() {
  // Demo steps
  // 0 = idle
  // 1 = invoice appears
  // 2 = customer opens / views
  // 3 = clicks Pay
  // 4 = processing
  // 5 = paid
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    const run = () => {
      setStep(0);

      timers.push(setTimeout(() => setStep(1), 600));   // show invoice
      timers.push(setTimeout(() => setStep(2), 2200));  // highlight pay button
      timers.push(setTimeout(() => setStep(3), 3800));  // click pay / method
      timers.push(setTimeout(() => setStep(4), 5200));  // processing
      timers.push(setTimeout(() => setStep(5), 7000));  // paid
      timers.push(setTimeout(run, 10000));
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
        <div className="absolute bottom-0 right-0 w-[65%] h-[55%] bg-gradient-to-tl from-violet-200/40 via-indigo-100/25 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            
            {/* LEFT */}
            <div className="space-y-5 max-w-lg">
              <h1 className="text-[40px] sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540]">
                Send invoices with<br />
                embedded payment buttons
              </h1>

              <p className="text-[16px] text-gray-600 leading-relaxed">
                Create professional invoices in seconds and let customers pay instantly via M-PESA, card, or bank transfer — right from the invoice. No follow-ups, no delays.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
                >
                  Create an invoice
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT – Invoice demo */}
            <div className="relative w-full max-w-[380px] mx-auto lg:ml-auto">
              <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
                
                {/* Invoice header */}
                <div className="bg-[#0a2540] text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-white/50">Invoice</p>
                    <p className="text-[15px] font-semibold">INV-2026-0847</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    step === 5
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {step === 5 ? 'Paid' : 'Pending'}
                  </div>
                </div>

                <div className="p-5">
                  {/* From / To */}
                  <div className="flex justify-between mb-5 text-[12px]">
                    <div>
                      <p className="text-gray-400 mb-0.5">From</p>
                      <p className="font-semibold text-[#0a2540]">Acme Supplies Ltd</p>
                      <p className="text-gray-500">Nairobi, Kenya</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 mb-0.5">Bill to</p>
                      <p className="font-semibold text-[#0a2540]">GreenMart Stores</p>
                      <p className="text-gray-500">Westlands</p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                    <div className="bg-gray-50 px-3 py-2 grid grid-cols-3 text-[11px] font-medium text-gray-500">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {[
                      { name: 'Office chairs', qty: 4, amount: '48,000' },
                      { name: 'Desk lamps', qty: 6, amount: '12,000' },
                      { name: 'Delivery', qty: 1, amount: '2,500' },
                    ].map((item) => (
                      <div key={item.name} className="px-3 py-2.5 grid grid-cols-3 text-[13px] border-t border-gray-50">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-center text-gray-500">{item.qty}</span>
                        <span className="text-right font-medium text-gray-800">KES {item.amount}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[13px] text-gray-500">Total due</span>
                    <span className="text-xl font-bold text-[#0a2540]">KES 62,500.00</span>
                  </div>

                  {/* Pay section */}
                  {step < 4 && (
                    <div className={`transition-all duration-300 ${step >= 2 ? 'scale-[1.02]' : ''}`}>
                      {step >= 3 ? (
                        <div className="space-y-2">
                          <p className="text-[12px] font-medium text-gray-500 mb-2">Pay with</p>
                          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#009A49] bg-[#009A49]/5">
                            <div className="w-8 h-8 rounded-lg bg-[#009A49] flex items-center justify-center text-white text-[10px] font-bold">M</div>
                            <span className="text-[13px] font-semibold text-[#0a2540]">M-PESA</span>
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200">
                            <CreditCard className="w-5 h-5 text-gray-500" />
                            <span className="text-[13px] font-semibold text-[#0a2540]">Card</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all ${
                            step >= 2
                              ? 'bg-[#635bff] shadow-lg shadow-[#635bff]/25'
                              : 'bg-[#0a2540]'
                          }`}
                        >
                          Pay KES 62,500.00
                        </button>
                      )}
                    </div>
                  )}

                  {/* Processing */}
                  {step === 4 && (
                    <div className="flex flex-col items-center py-4 animate-in fade-in duration-300">
                      <svg className="animate-spin h-8 w-8 text-[#635bff] mb-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-[13px] font-medium text-gray-600">Processing payment…</p>
                    </div>
                  )}

                  {/* Paid */}
                  {step === 5 && (
                    <div className="text-center py-3 animate-in fade-in duration-300">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-[15px] font-bold text-[#0a2540]">Payment received</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">KES 62,500.00 • M-PESA</p>
                    </div>
                  )}
                </div>
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
              Invoices that get paid faster
            </h2>
            <p className="text-lg text-gray-500">
              Stop chasing payments. Send an invoice with a pay button and get paid via M-PESA, card, or bank transfer in one click.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'One-click pay',
                desc: 'Every invoice includes a payment button. Customers pay without leaving the page.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: 'M-PESA & cards',
                desc: 'Accept M-PESA STK Push, Visa, Mastercard, and bank transfers on every invoice.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: <Mail className="w-5 h-5" />,
                title: 'Send anywhere',
                desc: 'Email, WhatsApp, or SMS. Share a link or attach a PDF — customers pay either way.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: <Bell className="w-5 h-5" />,
                title: 'Auto reminders',
                desc: 'Automatic payment reminders for overdue invoices so you don’t have to follow up.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Recurring invoices',
                desc: 'Schedule invoices to go out weekly, monthly, or custom — perfect for retainers.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                title: 'Secure & tracked',
                desc: 'Know when an invoice is viewed and paid. All payments are encrypted and logged.',
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

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="py-20 bg-[#f8f9fa] border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
              How Smart Invoicing works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create the invoice',
                desc: 'Add line items, taxes, due date, and customer details. Brand it with your logo and colors.',
              },
              {
                step: '02',
                title: 'Send it',
                desc: 'Email, WhatsApp, or copy the link. Your customer gets a clean invoice with a pay button.',
              },
              {
                step: '03',
                title: 'Get paid',
                desc: 'They pay via M-PESA, card, or bank. You get notified instantly and the invoice marks as paid.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#635bff]/10 text-[#635bff] font-bold text-sm mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">
            Start sending invoices that get paid
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create your first invoice in under a minute. Free sandbox, no setup fees.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0a2540] hover:bg-[#1a365d] text-white font-semibold transition-colors"
          >
            Create an invoice
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}