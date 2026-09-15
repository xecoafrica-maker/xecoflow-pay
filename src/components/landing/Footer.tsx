// src/app/release-notes/page.tsx
import Link from 'next/link';

type ChangeType = 'New' | 'Enhanced' | 'Fixed' | 'Security';

interface Release {
  type: ChangeType;
  date: string;
  product: string;
  title: string;
  summary: string;
  details?: string[];
}

const typeStyles: Record<ChangeType, string> = {
  New: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Enhanced: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Fixed: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Security: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const dotColor: Record<ChangeType, string> = {
  New: 'bg-emerald-500',
  Enhanced: 'bg-sky-500',
  Fixed: 'bg-amber-500',
  Security: 'bg-rose-500',
};

const releases: Release[] = [
  {
    type: 'New',
    date: 'September 9, 2026',
    product: 'Merchant Dashboard',
    title: 'Maintenance mode for storefronts',
    summary:
      'Pause your storefront without taking your integration offline. Customers see a friendly message while you push updates.',
    details: [
      'Toggle maintenance mode per store from the dashboard.',
      'Customize the message shown to customers during downtime.',
    ],
  },
  {
    type: 'New',
    date: 'September 9, 2026',
    product: 'Platform',
    title: 'Platform-wide maintenance mode',
    summary:
      'Coordinate scheduled maintenance across all connected services with a single switch.',
    details: [
      'Pause services cleanly for upgrades or hotfixes.',
      'Broadcast scheduled maintenance windows to users automatically.',
    ],
  },
  {
    type: 'Enhanced',
    date: 'August 28, 2026',
    product: 'STK Push',
    title: 'Quicker STK Push handoff',
    summary:
      'Push initiation across every M-PESA shortcode is now noticeably faster, with smarter retries when carriers are slow.',
    details: [
      'Median initiation time dropped from 3.2s to 1.4s.',
      'Adaptive retries reduce dead-end push failures.',
    ],
  },
  {
    type: 'New',
    date: 'August 15, 2026',
    product: 'B2C Disbursement',
    title: 'Schedule bulk payouts ahead of time',
    summary:
      'Queue B2C batches up to 30 days in advance and let XecoFlow run them on the day you choose.',
    details: [
      'CSV upload with a future execution date.',
      'Automatic retries for invalid or unreachable numbers.',
      'Reconciliation report ready to download after each run.',
    ],
  },
  {
    type: 'Fixed',
    date: 'August 2, 2026',
    product: 'Business Wallet',
    title: 'Wallet balance now updates instantly',
    summary:
      'Corrected a display bug where the wallet could briefly show a stale balance right after a transaction settled.',
    details: [
      'Balances refresh in real time after every transaction.',
      'Wallet webhooks now deliver more reliably under load.',
    ],
  },
  {
    type: 'Security',
    date: 'July 20, 2026',
    product: 'API & Gateway',
    title: 'TLS 1.3 enforced and signing keys rotated',
    summary:
      'We tightened transport security across the gateway and rotated the signing keys used for API authentication.',
    details: [
      'TLS 1.0 and 1.1 connections are now refused.',
      'Rotate your API signing keys from the dashboard to stay current.',
    ],
  },
];

// Group releases by month for the timeline rail
const grouped = releases.reduce<Record<string, Release[]>>((acc, release) => {
  const month = release.date.split(' ').slice(0, 2).join(' ');
  if (!acc[month]) acc[month] = [];
  acc[month].push(release);
  return acc;
}, {});

export default function ReleaseNotesPage() {
  return (
    <main className="bg-[#fafafa] text-[#0a2540] antialiased min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-[1080px] mx-auto px-6 sm:px-8 pt-10 pb-14">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-10">
            <Link href="/" className="hover:text-[#0a2540] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600">Release Notes</span>
          </nav>

          {/* Title block */}
          <div className="max-w-[720px]">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Living changelog
            </span>

            <h1 className="text-[46px] sm:text-[56px] font-bold leading-[1.02] tracking-tight mb-5">
              What&apos;s new in XecoFlow
            </h1>

            <p className="text-[17px] leading-relaxed text-gray-600">
              Every meaningful change to our payments platform — new features, improvements,
              fixes, and security updates. Grouped by month so you can scan what shipped and
              when.
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mt-9">
            <span className="text-[13px] text-gray-400 mr-2">Filter:</span>
            {(['New', 'Enhanced', 'Fixed', 'Security'] as ChangeType[]).map((t) => (
              <button
                key={t}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors ${typeStyles[t]} hover:opacity-80`}
              >
                {t}
              </button>
            ))}
            <button className="text-[13px] font-medium text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
              All
            </button>
          </div>
        </div>
      </section>

      {/* ── Timeline Body ─────────────────────────────────────────── */}
      <section className="max-w-[1080px] mx-auto px-6 sm:px-8 py-14">
        <div className="relative">

          {/* Vertical rail */}
          <div className="hidden md:block absolute left-[130px] top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-16">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month} className="md:flex md:gap-10">

                {/* Month label */}
                <div className="md:w-[130px] shrink-0 mb-6 md:mb-0">
                  <div className="md:sticky md:top-24">
                    <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                      {month}
                    </p>
                    <p className="text-[12px] text-gray-300 mt-1">
                      {items.length} {items.length === 1 ? 'update' : 'updates'}
                    </p>
                  </div>
                </div>

                {/* Entries */}
                <div className="flex-1 space-y-8">
                  {items.map((release, i) => (
                    <article key={i} className="relative md:pl-10">

                      {/* Timeline dot */}
                      <span
                        className={`hidden md:block absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-[#fafafa] ${dotColor[release.type]}`}
                      />

                      {/* Card */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 hover:shadow-[0_2px_20px_-6px_rgba(10,37,64,0.08)] transition-shadow">

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${typeStyles[release.type]}`}
                          >
                            {release.type}
                          </span>
                          <span className="text-[13px] text-gray-400">
                            {release.date}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-[13px] font-medium text-gray-500">
                            {release.product}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-[19px] font-semibold leading-snug mb-2.5">
                          {release.title}
                        </h2>

                        {/* Summary */}
                        <p className="text-[15px] leading-relaxed text-gray-600 mb-4">
                          {release.summary}
                        </p>

                        {/* Details */}
                        {release.details && (
                          <ul className="space-y-1.5 border-l-2 border-gray-100 pl-4">
                            {release.details.map((detail, j) => (
                              <li key={j} className="text-[14px] text-gray-500 leading-relaxed">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer pager ──────────────────────────────────────── */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-8">
          <p className="text-[13px] text-gray-400">
            You&apos;re viewing the latest 6 releases.
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="text-[13px] font-medium text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed"
            >
              ← Newer
            </button>
            <Link
              href="#"
              className="text-[13px] font-medium text-white bg-[#0a2540] hover:bg-[#12365a] px-4 py-2 rounded-lg transition-colors"
            >
              Older releases →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}