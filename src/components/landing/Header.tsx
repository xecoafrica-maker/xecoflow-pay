import Link from 'next/link';

export default function Header() {
  return (
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

                <div className="absolute top-full left-[-100px] w-[1040px] bg-white/95 backdrop-blur-[18px] border border-gray-200/80 shadow-2xl opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-6 rounded-2xl mt-1">
                  
                  {/* Payments Column */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Accept Payments</h4>
                    <div className="space-y-4">
                      <a href="/products/payment-links" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Payment Links</p><p className="text-xs text-gray-400 font-normal">Generate instant payment links with zero code</p></a>
                      <a href="/products/checkout" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Checkout</p><p className="text-xs text-gray-400 font-normal">Pre-built payment UI for web & mobile apps</p></a>
                      <a href="/products/pos" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Xeco POS</p><p className="text-xs text-gray-400 font-normal">Collect in-person & over-the-counter payments</p></a>
                      <a href="/products/invoicing" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Smart Invoicing</p><p className="text-xs text-gray-400 font-normal">Send invoices with embedded payment buttons</p></a>
                    </div>
                  </div>

                  {/* Revenue Column */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payouts & Transfers</h4>
                    <div className="space-y-4">
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Instant Payouts</p><p className="text-xs text-gray-400 font-normal">Bulk payouts to M-Pesa & local bank accounts</p></a>
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Airtime & Utility APIs</p><p className="text-xs text-gray-400 font-normal">Automated multi-network airtime & data distribution</p></a>
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Split Payments</p><p className="text-xs text-gray-400 font-normal">Automated multi-party settlements & commissions</p></a>
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Scheduled Disbursements</p><p className="text-xs text-gray-400 font-normal">Automate payroll & recurring vendor settlements</p></a>
                    </div>
                  </div>

                  {/* Platforms Column */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Platforms & Marketplaces</h4>
                    <div className="space-y-4">
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Wi-Fi Billing System</p><p className="text-xs text-gray-400 font-normal">Automated captive portals & MikroTik token provisioning</p></a>
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">Tax & Compliance Engine</p><p className="text-xs text-gray-400 font-normal">Automated return filings, KRA PIN lookups & TCC checks</p></a>
                      <a href="#" className="block group/item"><p className="text-[15px] font-semibold text-gray-800 group-hover/item:text-[#635bff]">KYC & Identity Verification</p><p className="text-xs text-gray-400 font-normal">Instant business checks & merchant identity validation</p></a>
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

                <div className="absolute top-full left-1/2 -translate-x-1/3 w-[880px] bg-white/95 backdrop-blur-[18px] border border-gray-200/80 shadow-2xl opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-4 gap-8 rounded-2xl mt-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By stage</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Enterprises</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Startups</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By use case</h4>
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
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By industry</h4>
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
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ecosystem</h4>
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

                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[850px] bg-white/95 backdrop-blur-[18px] border border-gray-200/80 shadow-2xl opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-8 rounded-2xl mt-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Get Started</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><Link href="/introduction" className="hover:text-[#635bff] transition-colors">Introduction</Link></li>
                      <li><Link href="/quickstart" className="hover:text-[#635bff] transition-colors">Quick Start Guide</Link></li>
                      <li><Link href="/sandbox" className="hover:text-[#635bff] transition-colors">Sandbox & Test Credentials</Link></li>
                      <li><Link href="/merchant-account" className="hover:text-[#635bff] transition-colors">Get a Merchant Account</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Core Documentation</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><Link href="/payment-methods" className="hover:text-[#635bff] transition-colors">Payment Methods</Link></li>
                      <li><Link href="/payment-solutions" className="hover:text-[#635bff] transition-colors">Payment Solutions</Link></li>
                      <li><Link href="/features" className="hover:text-[#635bff] transition-colors">Features</Link></li>
                      <li><Link href="/integrations" className="hover:text-[#635bff] transition-colors">Integrations</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Reference</h4>
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

                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[950px] bg-white/95 backdrop-blur-[18px] border border-gray-200/80 shadow-2xl opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-4 gap-8 rounded-2xl mt-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Learn</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Blog</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Customer stories</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Guides</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Support</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Get support</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Managed support plans</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Professional services</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Company</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><Link href="/about" className="hover:text-[#635bff] transition-colors">About Us</Link></li>
                      <li><Link href="/careers" className="hover:text-[#635bff] transition-colors">Careers</Link></li>
                      <li><Link href="/help-centre" className="hover:text-[#635bff] transition-colors">Help Centre</Link></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Product roadmap</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Newsroom</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Contact sales</a></li>
                      <li><a href="#" className="hover:text-[#635bff] transition-colors">Become a partner</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. TAX AUTOMATION DROPDOWN */}
              <div className="relative group/nav h-full flex items-center cursor-pointer">
                <span className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[#0a2540] hover:text-[#635bff] hover:bg-gray-100/80 transition-all duration-250">
                  Tax Automation
                  <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>

                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-white/95 backdrop-blur-[18px] border border-gray-200/80 shadow-2xl opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 pointer-events-none group-hover/nav:pointer-events-auto p-9 grid grid-cols-3 gap-8 rounded-2xl mt-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tax Filing</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><Link href="/tax/returns" className="hover:text-[#635bff] transition-colors">Automated Returns</Link></li>
                      <li><Link href="/tax/vat" className="hover:text-[#635bff] transition-colors">VAT Management</Link></li>
                      <li><Link href="/tax/withholding" className="hover:text-[#635bff] transition-colors">Withholding Tax</Link></li>
                      <li><Link href="/tax/payroll" className="hover:text-[#635bff] transition-colors">Payroll Taxes</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Compliance</h4>
                    <ul className="space-y-3 text-[15px] font-medium text-gray-600">
                      <li><Link href="/tax/kra-pin" className="hover:text-[#635bff] transition-colors">KRA PIN Lookup</Link></li>
                      <li><Link href="/tax/tcc" className="hover:text-[#635bff] transition-colors">TCC Verification</Link></li>
                      <li><Link href="/tax/filing-deadlines" className="hover:text-[#635bff] transition-colors">Filing Deadlines</Link></li>
                      <li><Link href="/tax/audit-trail" className="hover:text-[#635bff] transition-colors">Audit Trail</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resources</h4>
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
  );
}