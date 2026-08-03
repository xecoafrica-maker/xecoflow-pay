// src/landing/Headers/Products/PaymentLinks.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  Zap,
  Globe,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function PaymentLinksContent() {
  const [step, setStep] = useState(0);

  const [typedCard, setTypedCard] = useState('');
  const [typedExpiry, setTypedExpiry] = useState('');
  const [typedCvc, setTypedCvc] = useState('');

  const fullCardNumber = '4242 4242 4242 4242';
  const fullExpiry = '12 / 28';
  const fullCvc = '123';

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    const run = () => {
      setStep(0);
      setTypedCard('');
      setTypedExpiry('');
      setTypedCvc('');

      timers.push(setTimeout(() => setStep(1), 700));
      timers.push(setTimeout(() => setStep(2), 2000));
      timers.push(setTimeout(() => setStep(3), 3700));
      timers.push(setTimeout(() => setStep(4), 5200));
      timers.push(setTimeout(() => setStep(5), 7200));

      fullCardNumber.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => {
            setTypedCard((prev) => prev + char);
          }, 7400 + i * 60)
        );
      });

      const expiryStart = 7400 + fullCardNumber.length * 60 + 300;
      fullExpiry.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => {
            setTypedExpiry((prev) => prev + char);
          }, expiryStart + i * 80)
        );
      });

      const cvcStart = expiryStart + fullExpiry.length * 80 + 300;
      fullCvc.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => {
            setTypedCvc((prev) => prev + char);
          }, cvcStart + i * 90)
        );
      });

      const processStart = cvcStart + fullCvc.length * 90 + 600;
      timers.push(setTimeout(() => setStep(6), processStart));
      timers.push(setTimeout(() => setStep(7), processStart + 1800));
      timers.push(setTimeout(run, processStart + 4500));
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
        <div className="absolute bottom-0 right-0 w-[70%] h-[60%] bg-gradient-to-tl from-[#c7d2fe]/50 via-[#ddd6fe]/30 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-10 lg:pt-14 lg:pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* LEFT */}
            <div className="space-y-5 max-w-lg">
              <h1 className="text-[40px] sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540]">
                Share a link.<br />
                Get paid instantly.
              </h1>

              <p className="text-[16px] text-gray-600 leading-relaxed">
                Generate a secure payment link in seconds and send it to your customers via WhatsApp, SMS, or email. No website or coding required — just share and receive payments across M-PESA, cards, and more.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
                >
                  Create a payment link
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT – Floating chat */}
            <div className="relative h-[480px] lg:h-[520px] w-full max-w-[400px] mx-auto lg:ml-auto">
              
              {step >= 1 && (
                <div className="absolute top-0 left-0 animate-in fade-in slide-in-from-left-4 duration-400">
                  <p className="text-[12px] text-gray-400 mb-1.5 ml-1">Amina</p>
                  <div className="relative bg-white text-[14px] text-gray-800 px-4 py-3 rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] max-w-[260px]">
                    Hi, is the glow cream back in stock?
                    <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white rotate-45 shadow-sm" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="absolute top-[85px] left-0 animate-in fade-in duration-200">
                  <div className="bg-white px-4 py-3.5 rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {step >= 3 && (
                <div className="absolute top-[95px] right-0 flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-400">
                  <p className="text-[12px] text-gray-400 mb-1.5 mr-1">GlowLab</p>
                  <div className="bg-[#635bff] text-white text-[14px] px-4 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(99,91,255,0.25)] mb-1.5">
                    Hey, yes it is!
                  </div>
                  <div className="relative bg-[#635bff] text-white text-[14px] px-4 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(99,91,255,0.25)] max-w-[280px]">
                    It&apos;s part of this new set we just launched.
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#635bff] rotate-45" />
                  </div>
                </div>
              )}

              {step >= 4 && (
                <div className="absolute bottom-0 right-0 w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {step === 4 ? (
                    <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden">
                      <div className="h-[160px] bg-[#eef2ff] flex items-center justify-center overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop&q=80"
                          alt="GlowLab Pure Set"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-semibold text-[15px] text-[#0a2540]">GlowLab Pure Set</p>
                        <p className="text-[13px] text-gray-500 mt-0.5 truncate">
                          https://buy.xecoflow.com/aF8fUK
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] overflow-hidden">
                      <div className="h-[100px] bg-[#eef2ff] flex items-center justify-center overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop&q=80"
                          alt="GlowLab Pure Set"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4">
                        {step === 7 ? (
                          <div className="text-center py-5">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Check className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-[15px] font-bold text-[#0a2540]">Payment successful</p>
                            <p className="text-[12px] text-gray-500 mt-1">KES 10,000.00 • Pure kit</p>
                          </div>
                        ) : (
                          <>
                            <div className="text-center mb-3">
                              <p className="text-[12px] text-gray-500">Pure kit</p>
                              <p className="text-xl font-bold text-[#0a2540] mt-0.5">KES 10,000.00</p>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[11px] text-gray-500 mb-1 block">Card information</label>
                                <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-mono text-gray-700 flex items-center justify-between min-h-[38px]">
                                  <span>
                                    {typedCard}
                                    {step === 5 && typedCard.length < fullCardNumber.length && (
                                      <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                                    )}
                                  </span>
                                  {typedCard.length >= 4 && (
                                    <span className="text-[10px] font-bold text-blue-600 tracking-wide">VISA</span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-mono text-gray-700 min-h-[38px]">
                                  {typedExpiry || <span className="text-gray-300">MM / YY</span>}
                                  {step === 5 &&
                                    typedCard.length >= fullCardNumber.length &&
                                    typedExpiry.length < fullExpiry.length && (
                                      <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                                    )}
                                </div>
                                <div className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] font-mono text-gray-700 min-h-[38px]">
                                  {typedCvc || <span className="text-gray-300">CVC</span>}
                                  {step === 5 &&
                                    typedExpiry.length >= fullExpiry.length &&
                                    typedCvc.length < fullCvc.length && (
                                      <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                                    )}
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] text-gray-500 mb-1 block">Country or region</label>
                                <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-700">
                                  Kenya
                                </div>
                              </div>

                              <div className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 mt-1">
                                {step === 6 ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  <>Pay KES 10,000.00</>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────── */}
      <section className="pt-8 pb-20 bg-white border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
              Sell without a website
            </h2>
            <p className="text-lg text-gray-500">
              Payment links are the fastest way to start selling. Create a link, share it with your customers, and get paid in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'No code required',
                desc: 'Create a payment link in seconds without writing a single line of code.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: 'Share anywhere',
                desc: 'Send via WhatsApp, SMS, email or social. Customers pay from any device.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: 'Secure payments',
                desc: 'All transactions are encrypted and protected with enterprise-grade security.',
                color: 'bg-emerald-50 text-emerald-600',
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#f8f9fa] rounded-2xl p-7 border border-gray-100">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">
            Ready to get paid?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create your first payment link in minutes and start accepting payments from customers anywhere in Africa.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0a2540] hover:bg-[#1a365d] text-white font-semibold transition-colors"
          >
            Create your first link
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}