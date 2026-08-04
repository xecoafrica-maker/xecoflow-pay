// src/app/help-centre/page.tsx
// or src/app/support/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import {
  Search,
  ArrowRight,
  CreditCard,
  Link2,
  FileText,
  Store,
  Code2,
  Shield,
  Wallet,
  Settings,
  MessageCircle,
  Mail,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

const categories = [
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Payments',
    desc: 'Accepting payments, refunds, and settlements',
    href: '/help-centre/payments',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: 'Payment Links',
    desc: 'Create, share, and manage payment links',
    href: '/help-centre/payment-links',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Invoicing',
    desc: 'Send invoices and track payments',
    href: '/help-centre/invoicing',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: <Store className="w-5 h-5" />,
    title: 'Xeco POS',
    desc: 'In-person and counter payments',
    href: '/help-centre/pos',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'Developers',
    desc: 'API, webhooks, and integration guides',
    href: '/help-centre/developers',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Wallet className="w-5 h-5" />,
    title: 'Payouts & Balances',
    desc: 'Withdrawals, bank accounts, and ledgers',
    href: '/help-centre/payouts',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Security & Compliance',
    desc: 'KYC, fraud, and account protection',
    href: '/help-centre/security',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    title: 'Account & Settings',
    desc: 'Team access, branding, and preferences',
    href: '/help-centre/account',
    color: 'bg-gray-100 text-gray-600',
  },
];

const popularArticles = [
  {
    title: 'How to create your first payment link',
    category: 'Payment Links',
    href: '/help-centre/payment-links/create',
  },
  {
    title: 'Accepting M-PESA STK Push payments',
    category: 'Payments',
    href: '/help-centre/payments/mpesa-stk',
  },
  {
    title: 'Setting up webhooks for payment events',
    category: 'Developers',
    href: '/help-centre/developers/webhooks',
  },
  {
    title: 'How settlements and payouts work',
    category: 'Payouts',
    href: '/help-centre/payouts/settlements',
  },
  {
    title: 'Using Xeco POS on multiple tills',
    category: 'Xeco POS',
    href: '/help-centre/pos/multi-till',
  },
  {
    title: 'Sending an invoice with a pay button',
    category: 'Invoicing',
    href: '/help-centre/invoicing/create',
  },
];

export default function HelpCentrePage() {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-white text-[#0a2540] antialiased">
      <Header />

      {/* ─── HERO + SEARCH ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#f8f9fc]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-violet-100/30 to-transparent pointer-events-none" />

        <div className="relative max-w-[900px] mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0a2540] mb-4">
            How can we help?
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Search our guides or browse by topic. Get answers on payments, POS, invoicing, and more.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for articles, guides, or topics…"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-[15px] text-[#0a2540] placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] transition-all"
            />
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <h2 className="text-xl font-bold text-[#0a2540] mb-6">Browse by topic</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group bg-[#f8f9fa] hover:bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-5 transition-all hover:shadow-md"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.color}`}>
                  {cat.icon}
                </div>
                <h3 className="text-[15px] font-bold text-[#0a2540] mb-1 group-hover:text-[#635bff] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR ARTICLES ───────────────────────────────────────── */}
      <section className="py-16 bg-[#f8f9fa] border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0a2540]">Popular articles</h2>
            <Link
              href="/help-centre/all"
              className="text-[14px] font-medium text-[#635bff] hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#0a2540] group-hover:text-[#635bff] transition-colors truncate">
                    {article.title}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{article.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT SUPPORT ────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a2540] mb-3">
              Still need help?
            </h2>
            <p className="text-gray-500">
              Our support team is available to assist you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-[#f8f9fa] border border-gray-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#0a2540] mb-1">Live chat</h3>
              <p className="text-[13px] text-gray-500 mb-4">
                Chat with us in the dashboard. Available Mon–Fri, 8am–6pm EAT.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#635bff] hover:underline"
              >
                Open dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-[#f8f9fa] border border-gray-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#0a2540] mb-1">Email support</h3>
              <p className="text-[13px] text-gray-500 mb-4">
                Send us a message and we’ll reply within one business day.
              </p>
              <a
                href="mailto:support@xecoflow.com"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#635bff] hover:underline"
              >
                support@xecoflow.com
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}