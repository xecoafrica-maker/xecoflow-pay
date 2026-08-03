import Link from 'next/link';

export default function FeaturesOverviewPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Features Overview</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">Features Overview</h1>
      <p className="text-lg text-gray-500 leading-relaxed mb-8">
        Beyond basic payment processing, XecoFlow provides powerful features to automate billing, protect against fraud, and scale operations.
      </p>
      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {[
          { title: 'Recurring & Bulk Payments', desc: 'Automate subscription billing and bulk disbursements.', href: '/recurring' },
          { title: 'Fraud Protection', desc: 'Real-time risk scoring and velocity checks.', href: '/fraud' },
        ].map((f) => (
          <Link key={f.title} href={f.href} className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}