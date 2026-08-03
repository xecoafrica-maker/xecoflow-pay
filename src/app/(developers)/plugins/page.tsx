// src/app/(developers)/plugins/page.tsx
import Link from 'next/link';

export default function PluginsPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <Link href="/integrations" className="hover:text-gray-600">Integrations</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Plugins</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Available Plugins
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          XecoFlow provides official plugins for the most popular platforms. Install any plugin
          in minutes and start accepting payments immediately.
        </p>

        <div className="space-y-4 mb-8">
          {[
            { name: 'WooCommerce', type: 'E-commerce', desc: 'Accept M-PESA, Airtel Money, and card payments on your WordPress store.' },
            { name: 'Shopify', type: 'E-commerce', desc: "Sell online and in-person with East Africa's most popular payment methods." },
            { name: 'Magento', type: 'E-commerce', desc: 'Enterprise-grade checkout with full XecoFlow integration.' },
            { name: 'Wix', type: 'Website Builder', desc: 'Add XecoFlow as a payment method in your Wix site settings.' },
            { name: 'Node.js SDK', type: 'SDK', desc: 'Official JavaScript/TypeScript library for custom integrations.' },
            { name: 'Python SDK', type: 'SDK', desc: 'Python library for backend integration with XecoFlow.' },
            { name: 'PHP SDK', type: 'SDK', desc: 'Composer package for PHP applications.' },
            { name: 'Postman Collection', type: 'Tool', desc: 'Pre-built API requests for testing and development.' },
          ].map((plugin) => (
            <div key={plugin.name} className="flex items-start gap-4 border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{plugin.name}</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{plugin.type}</span>
                </div>
                <p className="text-sm text-gray-500">{plugin.desc}</p>
              </div>
              <Link href="/ecommerce-plugins" className="text-emerald-600 text-sm font-medium hover:text-emerald-700 whitespace-nowrap">
                View →
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/ecommerce-plugins" className="text-emerald-600 hover:text-emerald-700 font-medium">
                E-commerce Plugins →
              </Link>
              {' '}Detailed setup guides for WooCommerce, Shopify, and more.
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