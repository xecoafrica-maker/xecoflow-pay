// src/app/careers/page.tsx

'use client';

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  ArrowRight,
  MapPin,
  Heart,
  Zap,
  Users,
  Globe,
  Coffee,
  Mail,
  Briefcase,
} from 'lucide-react';

const perks = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Impact from day one',
    desc: 'Work on products that power real businesses across East Africa.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Small, focused team',
    desc: 'Collaborate closely with engineers, designers, and operators who care about craft.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Remote-friendly',
    desc: 'Based in Nairobi with flexibility to work from where you’re most productive.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Growth & learning',
    desc: 'We invest in your skills — conferences, courses, and time to experiment.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: <Coffee className="w-5 h-5" />,
    title: 'Healthy culture',
    desc: 'Clear communication, no unnecessary meetings, and respect for deep work.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'Rooted in Africa',
    desc: 'Build infrastructure that makes payments work better for the continent.',
    color: 'bg-teal-50 text-teal-600',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540] antialiased">
      <Header />

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#f8f9fc]" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[50%] bg-gradient-to-tl from-violet-200/40 via-indigo-100/25 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-[800px] mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-20 text-center">
          <p className="text-[15px] font-semibold text-[#635bff] mb-3">Careers</p>
          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-[#0a2540] mb-5">
            Build the future of<br />
            payments in Africa
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            We’re a small team solving big problems — making it simple for businesses to accept and manage payments across East Africa.
          </p>
        </div>
      </section>

      {/* ─── NO OPEN ROLES ──────────────────────────────────────────── */}
      <section className="pb-8">
        <div className="max-w-[640px] mx-auto px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-6 h-6 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-[#0a2540] mb-2">
              No open positions right now
            </h2>
            <p className="text-gray-500 text-[15px] leading-relaxed max-w-md mx-auto mb-6">
              We’re not hiring at the moment, but we’re always interested in meeting talented people. Drop us a note and we’ll keep you in mind for future roles.
            </p>
            <a
              href="mailto:careers@xecoflow.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a2540] hover:bg-[#1a365d] text-white text-[14px] font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              careers@xecoflow.com
            </a>
          </div>
        </div>
      </section>

      {/* ─── WHY XECOFLOW ───────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-3">
              Why people join XecoFlow
            </h2>
            <p className="text-gray-500">
              Even when we’re not hiring, here’s what working with us is about.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((item) => (
              <div
                key={item.title}
                className="bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="text-[15px] font-bold text-[#0a2540] mb-1.5">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OPEN SPEC ──────────────────────────────────────────────── */}
      <section className="py-16 bg-[#f8f9fa] border-y border-gray-100">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-3">
            Think you’d be a great fit?
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Send a short note about yourself and what you’d love to work on.
            We’ll reach out when a matching role opens up.
          </p>
          <a
            href="mailto:careers@xecoflow.com?subject=General%20application"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#635bff] hover:bg-[#5851db] text-white font-medium text-[15px] transition-colors"
          >
            Send an open application
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ─── BACK TO PRODUCT ────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Curious about what we’re building?
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#635bff] hover:underline"
          >
            Learn more about XecoFlow
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}