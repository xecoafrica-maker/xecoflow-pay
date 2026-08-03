// src/app/checkout/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  Zap,
  Smartphone,
  ShieldCheck,
  Globe,
  Code2,
  Check,
  CreditCard,
  Upload,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

export default function CheckoutPage() {
  // 0 = reset
  // 1 = upload product
  // 2 = customize branding
  // 3 = live checkout (typing)
  // 4 = processing
  // 5 = success
  const [step, setStep] = useState(0);
  const [typedCard, setTypedCard] = useState('');
  const [typedExpiry, setTypedExpiry] = useState('');
  const [typedCvc, setTypedCvc] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setUploadProgress(0);

      // 1. Upload product
      timers.push(setTimeout(() => setStep(1), 500));

      // Animate upload progress
      for (let i = 1; i <= 10; i++) {
        timers.push(setTimeout(() => setUploadProgress(i * 10), 700 + i * 120));
      }

      // 2. Customize branding
      timers.push(setTimeout(() => setStep(2), 2800));

      // 3. Live checkout form
      timers.push(setTimeout(() => setStep(3), 5500));

      // Type card
      fullCardNumber.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => setTypedCard((p) => p + char), 5800 + i * 50)
        );
      });

      const expiryStart = 5800 + fullCardNumber.length * 50 + 200;
      fullExpiry.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => setTypedExpiry((p) => p + char), expiryStart + i * 70)
        );
      });

      const cvcStart = expiryStart + fullExpiry.length * 70 + 200;
      fullCvc.split('').forEach((char, i) => {
        timers.push(
          setTimeout(() => setTypedCvc((p) => p + char), cvcStart + i * 80)
        );
      });

      const processStart = cvcStart + fullCvc.length * 80 + 400;
      timers.push(setTimeout(() => setStep(4), processStart));
      timers.push(setTimeout(() => setStep(5), processStart + 1500));
      timers.push(setTimeout(run, processStart + 4000));
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
        <div className="absolute bottom-0 right-0 w-[65%] h-[55%] bg-gradient-to-tl from-[#c7d2fe]/40 via-[#a5b4fc]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            
            {/* LEFT */}
            <div className="space-y-5 max-w-lg">
              <h1 className="text-[40px] sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540]">
                Pre-built payment UI<br />
                for web &amp; mobile
              </h1>

              <p className="text-[16px] text-gray-600 leading-relaxed">
                Launch a conversion-optimized checkout in minutes. Support M-PESA, cards, and bank transfers with a single integration — hosted by XecoFlow or embedded on your site.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* RIGHT – Demo stages */}
            <div className="relative w-full max-w-[400px] mx-auto lg:ml-auto min-h-[420px]">
              
              {/* STAGE 1: Upload product */}
              {step === 1 && (
                <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[#635bff]/10 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-[#635bff]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#0a2540]">Add your product</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-700">GlowLab Pure Set</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">KES 10,000.00</p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#635bff] rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    {uploadProgress < 100 ? 'Uploading…' : 'Upload complete'}
                  </p>
                </div>
              )}

              {/* STAGE 2: Customize branding */}
              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                  <div className="grid grid-cols-2">
                    {/* Preview (dark side) */}
                    <div className="bg-[#181818] text-white p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#9966FF] flex items-center justify-center text-[10px] font-bold">
                          G
                        </div>
                        <span className="text-[12px] font-medium">GlowLab</span>
                      </div>
                      <p className="text-[11px] text-white/50 mb-0.5">Pay GlowLab</p>
                      <p className="text-xl font-bold">KES 10,000</p>
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-white/60">Pure Set</span>
                          <span>KES 10,000</span>
                        </div>
                      </div>
                      <div className="mt-6 w-full py-2 bg-[#9966FF] rounded-lg text-[12px] font-medium text-center">
                        Pay KES 10,000
                      </div>
                    </div>

                    {/* Brand controls */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Palette className="w-4 h-4 text-[#635bff]" />
                        <p className="text-[13px] font-semibold text-[#0a2540]">Brand elements</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-1.5">Icon</p>
                        <div className="w-9 h-9 rounded-full bg-[#9966FF] flex items-center justify-center text-white text-[12px] font-bold">
                          G
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-1.5">Brand color</p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[#181818] border border-gray-200" />
                          <span className="text-[12px] font-mono text-gray-600">#181818</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-1.5">Accent color</p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[#9966FF] border border-gray-200" />
                          <span className="text-[12px] font-mono text-gray-600">#9966FF</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-1.5">Shapes</p>
                        <div className="text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                          Rounded
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 3–5: Live checkout */}
              {(step === 3 || step === 4 || step === 5) && (
                <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                  {/* Header */}
                  <div className="bg-[#181818] text-white px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#9966FF] flex items-center justify-center text-[10px] font-bold">
                        G
                      </div>
                      <span className="text-[12px] font-medium">GlowLab</span>
                    </div>
                    <p className="text-[11px] text-white/50">Pay GlowLab</p>
                    <p className="text-xl font-bold">KES 10,000.00</p>
                  </div>

                  <div className="p-5">
                    {step === 5 ? (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Check className="w-7 h-7 text-emerald-600" />
                        </div>
                        <p className="text-[16px] font-bold text-[#0a2540]">Payment successful</p>
                        <p className="text-[13px] text-gray-500 mt-1">KES 10,000.00 paid to GlowLab</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-gray-500 mb-1 block">Card number</label>
                          <div className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] font-mono text-gray-700 flex items-center justify-between min-h-[40px]">
                            <span>
                              {typedCard}
                              {step === 3 && typedCard.length < fullCardNumber.length && (
                                <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                              )}
                            </span>
                            {typedCard.length >= 4 && (
                              <span className="text-[10px] font-bold text-blue-600">VISA</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-gray-500 mb-1 block">Expiry</label>
                            <div className="px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] font-mono text-gray-700 min-h-[40px]">
                              {typedExpiry || <span className="text-gray-300">MM / YY</span>}
                              {step === 3 &&
                                typedCard.length >= fullCardNumber.length &&
                                typedExpiry.length < fullExpiry.length && (
                                  <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                                )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 mb-1 block">CVC</label>
                            <div className="px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] font-mono text-gray-700 min-h-[40px]">
                              {typedCvc || <span className="text-gray-300">CVC</span>}
                              {step === 3 &&
                                typedExpiry.length >= fullExpiry.length &&
                                typedCvc.length < fullCvc.length && (
                                  <span className="inline-block w-[1px] h-4 bg-gray-800 ml-0.5 animate-pulse" />
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="w-full py-3 bg-[#9966FF] text-white rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 mt-1">
                          {step === 4 ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────── */}
      <section className="pt-10 pb-20 bg-white border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-3">
              Everything you need to accept payments
            </h2>
            <p className="text-lg text-gray-500">
              A complete checkout experience with built-in support for African payment methods, mobile optimization, and enterprise security.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Go live in minutes',
                desc: 'Add Checkout with a few lines of code. No need to build forms or error handling yourself.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: 'Mobile-first design',
                desc: 'Optimized for every device. Smooth experience on phones, tablets, and desktops.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: 'Local payment methods',
                desc: 'Accept M-PESA, Airtel Money, cards, and bank transfers from one checkout.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: <ShieldCheck className="w-5 h-5" />,
                title: 'Secure by default',
                desc: 'PCI compliant, 3D Secure ready, and protected with fraud detection.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: <Code2 className="w-5 h-5" />,
                title: 'Hosted or embedded',
                desc: 'Redirect to a XecoFlow-hosted page, or embed Checkout in your app.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: <CreditCard className="w-5 h-5" />,
                title: 'One-time & recurring',
                desc: 'Support single payments and subscriptions with the same integration.',
                color: 'bg-amber-50 text-amber-600',
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

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">
            Start accepting payments today
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create your account and integrate Checkout in minutes. No setup fees, free sandbox included.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0a2540] hover:bg-[#1a365d] text-white font-semibold transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}