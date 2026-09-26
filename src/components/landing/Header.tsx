'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* ANNOUNCEMENT BAR */}
        <div className="relative bg-[#0a2540] text-white py-2.5 px-4 text-center text-sm font-medium">
          <div className="max-w-[1350px] mx-auto flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                🚀 Launching across East Africa
                <span className="ml-1">🇰🇪</span>
                <span>🇺🇬</span>
                <span>🇹🇿</span>
              </span>
            </span>
            <Link 
              href="/documentation" 
              className="text-[#A3E5F3] hover:text-white transition-colors inline-flex items-center gap-1 ml-2 font-medium"
            >
              View documentation
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* NAVBAR - Glass effect with scroll */}
        <nav className="relative bg-[rgba(255,255,255,0.82)] backdrop-blur-[18px] border-b border-[rgba(0,0,0,0.06)]">
          <div className="max-w-[1350px] mx-auto px-8 h-[80px] flex items-center justify-between">

            {/* LEFT SIDE: LOGO & NAVIGATION GROUPED */}
            <div className="flex items-center gap-8 xl:gap-12 h-full">

              {/* LOGO — Text only */}
              <Link href="/" className="text-[28px] font-bold tracking-tight flex-shrink-0">
                <span className="text-[#0a2540]">Xeco</span>
                <span className="text-[#10B981]">Flow</span>
              </Link>

              {/* NAVIGATION LINKS */}
              <div className="hidden lg:flex items-center justify-end gap-1 text-[17px] font-medium text-[#0a2540] h-full flex-wrap">
                
                {/* 1. PRODUCTS DROPDOWN */}
                <div className="relative group/nav h-full flex items-center cursor-pointer">
                  <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                    Products
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>

                  <div className="absolute top-full left-[-100px] w-[1040px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200/50 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-6 mt-1">
                    
                    {/* Payments Column */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Accept Payments</h4>
                      <div className="space-y-6">
                        <a href="/products/payment-links" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Payment Links</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Generate instant payment links with zero code</p>
                        </a>
                        <a href="/products/checkout" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Checkout</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Pre-built payment UI for web & mobile apps</p>
                        </a>
                        <a href="/products/pos" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Xeco POS</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Collect in-person & over-the-counter payments</p>
                        </a>
                        <a href="/products/invoicing" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Smart Invoicing</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Send invoices with embedded payment buttons</p>
                        </a>
                      </div>
                    </div>

                    {/* Revenue Column */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Payouts & Transfers</h4>
                      <div className="space-y-6">
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Instant Payouts</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Bulk payouts to M-Pesa & local bank accounts</p>
                        </a>
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Airtime & Utility APIs</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Automated multi-network airtime & data distribution</p>
                        </a>
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Split Payments</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Automated multi-party settlements & commissions</p>
                        </a>
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Scheduled Disbursements</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Automate payroll & recurring vendor settlements</p>
                        </a>
                      </div>
                    </div>

                    {/* Platforms Column */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Platforms & Marketplaces</h4>
                      <div className="space-y-6">
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">ISP Billing</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Automated captive portals & MikroTik token provisioning</p>
                        </a>
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">Tax & Compliance Engine</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Automated return filings, KRA PIN lookups & TCC checks</p>
                        </a>
                        <a href="#" className="block group/item">
                          <p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff] transition-colors">KYC & Identity Verification</p>
                          <p className="text-xs text-gray-400 font-normal mt-0.5">Instant business checks & merchant identity validation</p>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SOLUTIONS DROPDOWN */}
                <div className="relative group/nav h-full flex items-center cursor-pointer">
                  <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                    Solutions
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>

                  <div className="absolute top-full left-1/2 -translate-x-1/3 w-[880px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200/50 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-4 gap-8 mt-1">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">By stage</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Enterprises</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Startups</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">By use case</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Agentic commerce</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Crypto</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Ecommerce</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Embedded finance</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Finance automation</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Global businesses</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">By industry</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">AI companies</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Creator economy</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Hospitality, travel, and leisure</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Insurance</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Media and entertainment</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Cyber Cafes & Hotspots</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Neighborhood ISPs</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Commodity Resellers</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Ecosystem</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Partners</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Stripe App Marketplace</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. DEVELOPERS DROPDOWN */}
                <div className="relative group/nav h-full flex items-center cursor-pointer">
                  <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                    Developers
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[850px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200/50 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-8 mt-1">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Get Started</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/introduction" className="hover:text-[#635bff] transition-colors">Introduction</Link></li>
                        <li><Link href="/quickstart" className="hover:text-[#635bff] transition-colors">Quick Start Guide</Link></li>
                        <li><Link href="/sandbox" className="hover:text-[#635bff] transition-colors">Sandbox & Test Credentials</Link></li>
                        <li><Link href="/merchant-account" className="hover:text-[#635bff] transition-colors">Get a Merchant Account</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Core Documentation</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/payment-methods" className="hover:text-[#635bff] transition-colors">Payment Methods</Link></li>
                        <li><Link href="/payment-solutions" className="hover:text-[#635bff] transition-colors">Payment Solutions</Link></li>
                        <li><Link href="/features" className="hover:text-[#635bff] transition-colors">Features</Link></li>
                        <li><Link href="/integrations" className="hover:text-[#635bff] transition-colors">Integrations</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Reference</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/api-docs/reference" className="hover:text-[#635bff] transition-colors">API Reference</Link></li>
                        <li><Link href="/plugins" className="hover:text-[#635bff] transition-colors">SDKs & Plugins</Link></li>
                        <li><Link href="/resources/faq" className="hover:text-[#635bff] transition-colors">FAQ</Link></li>
                        <li><a href="https://github.com/xecoflow" target="_blank" rel="noopener noreferrer" className="hover:text-[#635bff] transition-colors">GitHub</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4. RESOURCES DROPDOWN - MERGED WITH COMPANY */}
                <div className="relative group/nav h-full flex items-center cursor-pointer">
                  <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                    Resources
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[950px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200/50 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-4 gap-8 mt-1">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Learn</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Customer stories</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Guides</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Support</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Get support</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Managed support plans</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Professional services</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Company</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/about" className="hover:text-[#635bff] transition-colors">About Us</Link></li>
                        <li><Link href="/careers" className="hover:text-[#635bff] transition-colors">Careers</Link></li>
                        <li><Link href="/help-centre" className="hover:text-[#635bff] transition-colors">Help Centre</Link></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Product roadmap</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Newsroom</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Contact</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Contact sales</a></li>
                        <li><a href="#" className="hover:text-[#635bff] transition-colors">Become a partner</a></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 5. TAX Services DROPDOWN */}
                <div className="relative group/nav h-full flex items-center cursor-pointer">
                  <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                    Tax Services
                    <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-200/50 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-8 mt-1">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Tax Filing</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/tax/returns" className="hover:text-[#635bff] transition-colors">Automated Returns</Link></li>
                        <li><Link href="/tax/vat" className="hover:text-[#635bff] transition-colors">VAT Management</Link></li>
                        <li><Link href="/tax/withholding" className="hover:text-[#635bff] transition-colors">Withholding Tax</Link></li>
                        <li><Link href="/tax/payroll" className="hover:text-[#635bff] transition-colors">Payroll Taxes</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Compliance</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        {/* CHANGED TO BUTTON TO TRIGGER MODAL */}
                        <li>
                          <button 
                            onClick={() => setIsPinModalOpen(true)} 
                            className="hover:text-[#635bff] transition-colors text-left"
                          >
                            FIND MY KRA PIN
                          </button>
                        </li>
                        <li><Link href="/tax/tcc" className="hover:text-[#635bff] transition-colors">TCC Verification</Link></li>
                        <li><Link href="/tax/filing-deadlines" className="hover:text-[#635bff] transition-colors">Filing Deadlines</Link></li>
                        <li><Link href="/tax/audit-trail" className="hover:text-[#635bff] transition-colors">Audit Trail</Link></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">Resources</h4>
                      <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                        <li><Link href="/tax/guides" className="hover:text-[#635bff] transition-colors">Tax Guides</Link></li>
                        <li><Link href="/tax/calculators" className="hover:text-[#635bff] transition-colors">Tax Calculators</Link></li>
                        <li><Link href="/tax/faq" className="hover:text-[#635bff] transition-colors">FAQ</Link></li>
                        <li><Link href="/tax/support" className="hover:text-[#635bff] transition-colors">Get Support</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full border border-gray-700 text-[17px] font-medium text-gray-800 hover:bg-gray-50 transition-all"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-full bg-[#A3E5F3] text-gray-800 text-[17px] font-medium hover:bg-[#8ED9E9] transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* --- FIND MY PIN MODAL --- */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPinModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-[500px] rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#0a2540]">Find My PIN</h2>
              </div>
              <button 
                onClick={() => setIsPinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-[#F0F7F4] rounded-2xl p-4 mb-6">
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Look up your KRA PIN number using your national ID or passport number. Free, instant, no account needed.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID / PASSPORT NUMBER <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 12345678"
                  className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Most users should leave taxpayer type as Kenyan Citizen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  TAXPAYER TYPE
                </label>
                <div className="relative">
                  <select className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all cursor-pointer">
                    <option>Kenyan Citizen</option>
                    <option>Kenyan Resident</option>
                    <option>Non-Resident</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <button className="w-full bg-[#22C55E] hover:bg-[#1ea34d] text-white font-semibold text-[17px] py-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] flex items-center justify-center gap-2 mt-2">
                Find My PIN
                <span className="text-xl leading-none">→</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}