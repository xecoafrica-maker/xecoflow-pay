// src/app/about/page.tsx

'use client';

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  Target,
  Globe,
  Shield,
  Zap,
  Users,
  Heart,
} from 'lucide-react';

const values = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Built for Africa',
    desc: 'We design every product around the payment methods and realities of East African businesses — M-PESA first, then cards and banks.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Trust & security',
    desc: 'Enterprise-grade security, compliance, and transparency. Your money and your customers’ data are protected at every step.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Developer-first',
    desc: 'Clean APIs, clear docs, and tools that let engineers ship payment features in days — not months.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Customer obsession',
    desc: 'From sole traders to large retailers, we listen, support, and improve so you can focus on growing your business.',
    color: 'bg-rose-50 text-rose-600',
  },
];

const milestones = [
  { year: '2024', title: 'Founded', desc: 'XecoFlow started in Nairobi with a simple idea: payments infrastructure that works for African businesses.' },
  { year: '2025', title: 'Launch', desc: 'Launched Payment Links, Checkout, and Smart Invoicing. First merchants went live across Kenya.' },
  { year: '2026', title: 'Scale', desc: 'Expanded to Xeco POS, multi-network support, and partnerships with banks and mobile money providers.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540] antialiased">
      <Header />

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#f8f9fc]" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[50%] bg-gradient-to-tl from-violet-200/40 via-indigo-100/25 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[900px] mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-20 text-center">
          <p className="text-[15px] font-semibold text-[#635bff] mb-3">About XecoFlow</p>
          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540] mb-5">
            Payments infrastructure<br />
            built for Africa
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            We’re building the rails that let businesses accept M-PESA, cards, and bank transfers through a single platform — so they can get paid faster and grow with confidence.
          </p>
        </div>
      </section>

      {/* ─── MISSION ────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#635bff]/10 text-[#635bff] flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-4">
                Our mission
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Too many businesses in East Africa still juggle multiple payment providers, manual reconciliations, and unreliable tools. We exist to change that.
              </p>
              <p className="text-gray-600 leading-relaxed">
                XecoFlow gives merchants, platforms, and developers one reliable way to collect, track, and settle payments — online and in person — without the complexity.
              </p>
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl border border-gray-100 p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0a2540]">East Africa focused</p>
                  <p className="text-sm text-gray-500 mt-0.5">Built around M-PESA, Airtel Money, and local bank rails.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0a2540]">One integration</p>
                  <p className="text-sm text-gray-500 mt-0.5">Payment Links, Checkout, Invoicing, and POS — one API.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0a2540]">Enterprise ready</p>
                  <p className="text-sm text-gray-500 mt-0.5">Security, compliance, and support that scale with you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUES ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#f8f9fa] border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-3">
              What we stand for
            </h2>
            <p className="text-gray-500">
              The principles that guide how we build products and support our customers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100">
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

      {/* ─── TIMELINE ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-3">
              Our journey
            </h2>
            <p className="text-gray-500">
              From a small team in Nairobi to powering businesses across East Africa.
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((item, i) => (
              <div key={item.year} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#635bff]/10 text-[#635bff] flex items-center justify-center text-[12px] font-bold shrink-0">
                    {item.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="text-[12px] font-semibold text-[#635bff] mb-0.5">{item.year}</p>
                  <h3 className="text-[16px] font-bold text-[#0a2540] mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#f8f9fa] border-t border-gray-100">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-3">
            Join us on the journey
          </h2>
          <p className="text-gray-600 mb-8">
            Whether you’re a merchant, a developer, or looking to join the team — we’d love to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
            >
              Start accepting payments
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-[15px] transition-colors hover:bg-white"
            >
              View careers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}