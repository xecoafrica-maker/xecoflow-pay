// src/app/(developers)/introduction/page.tsx
import Link from 'next/link';

export default function IntroductionPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Developers</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Introduction to XecoFlow Payments
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Welcome to the XecoFlow developer documentation. This guide will help you integrate
          our payment gateway into your application, website, or platform. XecoFlow provides
          a unified API for processing payments across Africa — from mobile money to
          credit cards and bank transfers.
        </p>

        {/* Key Features Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            {
              title: 'Unified API',
              description: 'One endpoint for M-PESA, Airtel Money, Visa, Mastercard, and bank transfers.',
              icon: '🔌',
            },
            {
              title: 'Sandbox Environment',
              description: 'Test your integration with our sandbox environment before going live. No real money involved.',
              icon: '🧪',
            },
            {
              title: 'Webhooks',
              description: 'Receive real-time notifications for payment events. Keep your system in sync automatically.',
              icon: '🔔',
            },
            {
              title: 'SDK Support',
              description: 'Official SDKs for Node.js, Python, PHP, and more. Start integrating in minutes.',
              icon: '📦',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-all"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Making Your First Payment
        </h2>
        <p className="text-gray-500 mb-6">
          Here's a quick example of how to initiate a payment using the XecoFlow SDK:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js Example</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const xecoflow = require('@xecoflow/sdk')('sk_live_xxxx');

const payment = await xecoflow.payments.create({
  action: 'charge',
  method: 'mpesa',
  phone: '254712345678',
  amount: 500,
  shortcode: '7450249',
  idempotencyKey: 'unique-key-123'
});

console.log(payment.checkoutRequestId);
// => 'ws_CO_123456789'`}</code>
          </pre>
        </div>

        {/* API Endpoints Quick Reference */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Quick Reference
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Endpoint</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { endpoint: '/v1/payments', method: 'POST', description: 'Create a payment' },
                { endpoint: '/v1/payments/{id}', method: 'GET', description: 'Retrieve a payment' },
                { endpoint: '/v1/payments/{id}/refund', method: 'POST', description: 'Refund a payment' },
                { endpoint: '/v1/balance', method: 'GET', description: 'Check account balance' },
              ].map((row) => (
                <tr key={row.endpoint} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-gray-800">{row.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                      {row.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/quickstart" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Quick Start Guide →
              </Link>
              {' '}Get up and running in under 5 minutes
            </li>
            <li>
              <Link href="/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Authentication →
              </Link>
              {' '}Learn how to authenticate your API requests
            </li>
            <li>
              <Link href="/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods →
              </Link>
              {' '}Explore all supported payment methods
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}