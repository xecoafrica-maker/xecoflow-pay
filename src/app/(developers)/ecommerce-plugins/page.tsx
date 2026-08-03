// src/app/(developers)/ecommerce-plugins/page.tsx
import Link from 'next/link';

export default function EcommercePluginsPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <Link href="/payment-solutions" className="hover:text-gray-600">Payment Solutions</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">E-commerce Plugins</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        E-commerce Plugins
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          XecoFlow offers official plugins for the most popular e-commerce platforms. Install in
          minutes and start accepting payments through M-PESA, Airtel Money, cards, and bank
          transfers — without writing a single line of code.
        </p>

        {/* Supported Platforms */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Supported Platforms
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              name: 'WooCommerce',
              desc: 'The most popular e-commerce platform for WordPress. Full support for M-PESA, Airtel, and cards.',
              icon: '🛒',
              link: '#',
            },
            {
              name: 'Shopify',
              desc: 'Sell online, on social media, and in person. Accept payments from anywhere in East Africa.',
              icon: '🛍️',
              link: '#',
            },
            {
              name: 'Magento',
              desc: 'Enterprise-grade e-commerce for large businesses. Customizable checkout with XecoFlow.',
              icon: '🏬',
              link: '#',
            },
            {
              name: 'Wix',
              desc: 'Build your website and start selling. Add XecoFlow as a payment provider in your site settings.',
              icon: '🎨',
              link: '#',
            },
          ].map((platform) => (
            <Link
              key={platform.name}
              href={platform.link}
              className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{platform.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {platform.name}
              </h3>
              <p className="text-sm text-gray-500">{platform.desc}</p>
            </Link>
          ))}
        </div>

        {/* WooCommerce Installation */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Installing the WooCommerce Plugin
        </h2>
        <p className="text-gray-600 mb-4">
          The XecoFlow WooCommerce plugin is available in the WordPress plugin directory.
        </p>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Installation Steps</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`1. Go to your WordPress Admin → Plugins → Add New
2. Search for "XecoFlow Payments"
3. Click "Install Now" → "Activate"
4. Go to WooCommerce → Settings → Payments
5. Enable "XecoFlow" as a payment method
6. Enter your API Key and API Secret
7. Select payment methods to offer (M-PESA, Airtel, Card)
8. Save changes`}</code>
          </pre>
        </div>

        {/* Configuration */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Configuration for Any Plugin
        </h2>
        <p className="text-gray-600 mb-4">
          All plugins require the same basic configuration:
        </p>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Setting</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['API Key', 'Your XecoFlow API key (starts with sk_live_ or sk_test_)'],
                ['API Secret', 'Your XecoFlow API secret for HMAC signature generation'],
                ['Environment', 'Choose Sandbox for testing or Production for live payments'],
                ['Payment Methods', 'Select which methods to offer at checkout'],
                ['Webhook URL', 'Auto-configured — XecoFlow sends payment notifications to your store'],
              ].map(([setting, desc]) => (
                <tr key={setting} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{setting}</td>
                  <td className="py-3 px-4 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Testing */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Testing Your Plugin
        </h2>
        <p className="text-gray-600 mb-4">
          Always test your plugin in sandbox mode before going live:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600 mb-6">
          <li>Set the environment to <strong>Sandbox</strong> in plugin settings</li>
          <li>Add a product to your cart and proceed to checkout</li>
          <li>Select XecoFlow as your payment method</li>
          <li>Use sandbox test phone numbers to simulate payments</li>
          <li>Verify that orders are marked as "Paid" after successful payment</li>
          <li>Switch to <strong>Production</strong> when ready to go live</li>
        </ol>

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/features" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Features Overview →
              </Link>
              {' '}Explore recurring payments, fraud protection, and more.
            </li>
            <li>
              <Link href="/integrations" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Integrations →
              </Link>
              {' '}See all available integrations and plugins.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}