// src/app/release-notes/page.tsx
import Link from 'next/link';

type ChangeType = 'Feature' | 'Improvement' | 'Fix' | 'Security';

interface Release {
  type: ChangeType;
  date: string;
  product: string;
  title: string;
  description: string;
  points?: string[];
}

const badgeStyles: Record<ChangeType, string> = {
  Feature: 'bg-[#0a2540] text-white',
  Improvement: 'bg-[#10B981] text-white',
  Fix: 'bg-amber-500 text-white',
  Security: 'bg-red-600 text-white',
};

const releases: Release[] = [
  {
    type: 'Feature',
    date: 'Sep 9, 2026',
    product: 'Merchant Dashboard',
    title: 'Maintenance mode functionality added',
    description: 'Merchants can now enable maintenance mode for their stores.',
    points: [
      'Notify customers when the store is under maintenance.',
      'Display a custom message during maintenance periods.',
    ],
  },
  {
    type: 'Feature',
    date: 'Sep 9, 2026',
    product: 'Platform',
    title: 'Maintenance mode implemented',
    description: 'You can now enable maintenance mode for your platform.',
    points: [
      'Temporarily pause services for updates or fixes.',
      'Notify users about scheduled maintenance easily.',
    ],
  },
  {
    type: 'Improvement',
    date: 'Aug 28, 2026',
    product: 'STK Push',
    title: 'Faster STK Push response times',
    description: 'Reduced average STK Push initiation latency across all M-PESA shortcodes.',
    points: [
      'Average response time improved from 3.2s to 1.4s.',
      'Better retry handling for failed push requests.',
    ],
  },
  {
    type: 'Feature',
    date: 'Aug 15, 2026',
    product: 'B2C Disbursement',
    title: 'Bulk payout scheduling',
    description: 'Schedule B2C disbursements up to 30 days in advance.',
    points: [
      'Upload a CSV and set a future execution date.',
      'Automatic retries for failed recipient numbers.',
      'Downloadable payout reconciliation report.',
    ],
  },
  {
    type: 'Fix',
    date: 'Aug 02, 2026',
    product: 'Business Wallet',
    title: 'Balance display inconsistency resolved',
    description: 'Fixed an issue where wallet balances could briefly show stale values after a transaction.',
    points: [
      'Balances now refresh in real time after every transaction.',
      'Improved webhook delivery reliability for wallet events.',
    ],
  },
  {
    type: 'Security',
    date: 'Jul 20, 2026',
    product: 'API & Gateway',
    title: 'Enforced TLS 1.3 and rotated signing keys',
    description: 'All API traffic now requires TLS 1.3 or higher, and signing keys have been rotated.',
    points: [
      'Legacy TLS 1.0 and 1.1 connections are now rejected.',
      'Rotate your API signing keys from the dashboard.',
    ],
  },
];

export default function ReleaseNotesPage() {
  return (
    <main className="bg-white text-[#0a2540] antialiased">
      <div className="max-w-[820px] mx-auto px-6 sm:px-8 py-12 sm:py-16">

        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-[14px] text-gray-500 mb-10">
          <Link href="/" className="hover:text-[#0a2540] transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#0a2540]">Release Notes</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────── */}
        <p className="text-[12px] font-medium tracking-[0.18em] text-gray-400 uppercase mb-4">
          Shipping Log
        </p>
        <h1 className="text-[44px] sm:text-[52px] font-bold leading-[1.05] tracking-tight text-[#0a2540] mb-5">
          Releases &amp; updates
        </h1>
        <p className="text-[17px] leading-relaxed text-gray-600 mb-10">
          A running record of everything we&apos;ve shipped on XecoFlow — new capabilities,
          refinements, bug fixes, and security patches. The most recent entries sit at the top;
          move through the pages below to look back at earlier work.
        </p>

        <hr className="border-gray-200 mb-10" />

        {/* ── Release Cards ───────────────────────────────────────── */}
        <div className="space-y-6">
          {releases.map((release, i) => (
            <article
              key={i}
              className="border border-gray-200 rounded-2xl p-6 sm:p-7 hover:border-gray-300 transition-colors"
            >
              {/* Badge + meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`inline-block text-[12px] font-semibold px-2.5 py-1 rounded ${badgeStyles[release.type]}`}
                >
                  {release.type}
                </span>
                <span className="text-[14px] text-gray-500">
                  {release.date} · {release.product}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-[20px] font-semibold text-[#0a2540] mb-2.5 leading-snug">
                {release.title}
              </h2>

              {/* Description */}
              <p className="text-[15px] leading-relaxed text-gray-600 mb-4">
                {release.description}
              </p>

              {/* Bullet points */}
              {release.points && (
                <ul className="space-y-2">
                  {release.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-3 text-[15px] text-gray-600">
                      <span className="text-gray-400 mt-[2px] select-none">—</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {/* ── Pager ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
          <button
            disabled
            className="text-[14px] font-medium text-gray-300 cursor-not-allowed"
          >
            ← Newer
          </button>
          <span className="text-[14px] text-gray-400">Page 1 of 4</span>
          <Link
            href="#"
            className="text-[14px] font-medium text-[#0a2540] hover:text-[#10B981] transition-colors"
          >
            Older →
          </Link>
        </div>
      </div>
    </main>
  );
}