// src/components/landing/Footer.tsx
'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const countries = [
  { code: 'ke', label: 'Kenya', flag: '🇰🇪' },
  { code: 'ug', label: 'Uganda', flag: '🇺🇬' },
  { code: 'tz', label: 'Tanzania', flag: '🇹🇿' },
  { code: 'rw', label: 'Rwanda', flag: '🇷🇼' },
];

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCountry = searchParams.get('country') || 'ke';

  const handleCountryChange = (countryCode: string) => {
    // Update URL with the selected country as a query param
    const params = new URLSearchParams(searchParams.toString());
    params.set('country', countryCode);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <footer className="relative bg-[#0a2540] text-[#adbbca] pt-24 pb-12 overflow-hidden antialiased">
      {/* Decorative glows */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1350px] mx-auto px-8 relative z-10">
        
        {/* ── Main Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 lg:gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-1.5 font-bold text-[26px] tracking-tight mb-5">
                <span className="text-white">Xeco</span>
                <span className="text-[#10B981]">Flow</span>
              </Link>
              <p className="text-[15px] text-[#adbbca]/80 max-w-[300px] mb-6 leading-relaxed">
                Payment infrastructure for Africa. Accept M‑PESA, Airtel, Visa, and more — all through one integrated platform.
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  PCI DSS Level 1
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  SSL / TLS 1.3
                </span>
              </div>
            </div>
          </div>

          {/* Link Columns (unchanged) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-semibold text-[15px] tracking-wide mb-5">Products</h4>
            <ul className="space-y-3.5 text-[15px]">
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Payment Pages</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">API & Gateway</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Invoices</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Point of Sale</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">QR Code Payments</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Subscription Billing</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-semibold text-[15px] tracking-wide mb-5">Developers</h4>
            <ul className="space-y-3.5 text-[15px]">
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">API Reference</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">SDKs & Libraries</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Webhooks</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Status Page</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Changelog</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-semibold text-[15px] tracking-wide mb-5">Company</h4>
            <ul className="space-y-3.5 text-[15px]">
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Partners</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Contact Sales</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Media Kit</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-semibold text-[15px] tracking-wide mb-5">Legal</h4>
            <ul className="space-y-3.5 text-[15px]">
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">PCI Compliance</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">GDPR</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Data Processing</Link></li>
              <li><Link href="#" className="hover:text-white transition-all duration-150 inline-block hover:translate-x-0.5">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ──────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Copyright & Regulatory Notes */}
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-[13px] text-[#adbbca]/60">
              &copy; {new Date().getFullYear()} XecoFlow Technologies Ltd. All rights reserved.
            </p>
            <p className="text-[12px] text-[#adbbca]/40 leading-relaxed font-light">
              XecoFlow Technologies Ltd is registered in Kenya. Regulated by the Central Bank of Kenya under License No: PS/2026/001. All transactional services are processed via secure encrypted bank-grade lines.
            </p>
          </div>

          {/* ── Country Switcher ── */}
          <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-xl backdrop-blur-md">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountryChange(country.code)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  currentCountry === country.code
                    ? 'bg-white/[0.07] text-white'
                    : 'hover:bg-white/[0.04] text-[#adbbca]/80 hover:text-white'
                }`}
              >
                <span>{country.flag}</span> {country.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}