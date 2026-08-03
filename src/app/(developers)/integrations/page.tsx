// src/app/(developers)/integrations/page.tsx
import Link from 'next/link';

export default function IntegrationsOverviewPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Integrations Overview</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Integrations Overview
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          XecoFlow integrates with the tools and platforms you already use. From e-commerce
          platforms to accounting software, connect your payment flow without custom development.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            { title: 'E-commerce Plugins', desc: 'WooCommerce, Shopify, Magento, Wix — accept payments directly on your store.', href: '/ecommerce-plugins' },
            { title: 'Plugins & Extensions', desc: 'Full list of available plugins for various platforms and frameworks.', href: '/plugins' },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/plugins" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Browse All Plugins →
              </Link>
              {' '}See the complete list of available plugins.
            </li>
            <li>
              <Link href="/api-docs/reference" className="text-emerald-600 hover:text-emerald-700 font-medium">
                API Reference →
              </Link>
              {' '}Build a custom integration using our unified API.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}