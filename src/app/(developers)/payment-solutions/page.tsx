// src/app/(developers)/payment-solutions/page.tsx
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function PaymentSolutionsPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Payment Solutions</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Payment Solutions
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          XecoFlow offers two primary payment solutions to help you collect payments online:
          <strong> Hosted Payment Pages</strong> and <strong>Payment Links</strong>.
          Both are built on the same unified gateway, ensuring secure and reliable processing.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            {
              title: 'Hosted Payment Page',
              desc: 'A fully branded checkout page hosted by XecoFlow. Redirect customers to our secure page and let us handle the payment flow.',
              href: '#hosted-payment',
              icon: '🌐',
            },
            {
              title: 'Payment Links',
              desc: 'Create simple, shareable payment links for invoices, products, or services. No coding required – just generate and share.',
              href: '#payment-links',
              icon: '🔗',
            },
          ].map((solution) => (
            <div
              key={solution.title}
              className="border border-gray-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-4">{solution.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{solution.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{solution.desc}</p>
            </div>
          ))}
        </div>

        {/* ─── HOSTED PAYMENT PAGE ────────────────────────────────── */}
        <div id="hosted-payment" className="scroll-mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Hosted Payment Page Integration
          </h2>
          <p className="text-gray-500 mb-6">
            To redirect a customer to the XecoFlow hosted payment page, you need to create a
            <strong> payment session</strong> by calling our API. The session holds all the
            information about the transaction and returns a unique URL where the customer will
            complete the payment.
          </p>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">
            What You Need to Pass
          </h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Field</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Required</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">amount</td>
                  <td className="py-2 px-3 text-gray-500">number</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">Yes</td>
                  <td className="py-2 px-3 text-gray-500">The amount to charge (in the smallest currency unit, e.g., KES).</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">currency</td>
                  <td className="py-2 px-3 text-gray-500">string</td>
                  <td className="py-2 px-3 text-gray-400">No (default: KES)</td>
                  <td className="py-2 px-3 text-gray-500">Currency code (e.g., KES, USD, UGX).</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">description</td>
                  <td className="py-2 px-3 text-gray-500">string</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">Yes</td>
                  <td className="py-2 px-3 text-gray-500">A brief description of the payment (shown to the customer).</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">customer.name</td>
                  <td className="py-2 px-3 text-gray-500">string</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">Yes</td>
                  <td className="py-2 px-3 text-gray-500">Full name of the customer (pre-filled on the payment page).</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">customer.email</td>
                  <td className="py-2 px-3 text-gray-500">string</td>
                  <td className="py-2 px-3 text-gray-400">No</td>
                  <td className="py-2 px-3 text-gray-500">Customer email address.</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">customer.phone</td>
                  <td className="py-2 px-3 text-gray-500">string</td>
                  <td className="py-2 px-3 text-gray-400">No</td>
                  <td className="py-2 px-3 text-gray-500">Customer phone number (for M-PESA/airtel payments).</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">successUrl</td>
                  <td className="py-2 px-3 text-gray-500">string (URL)</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">Yes</td>
                  <td className="py-2 px-3 text-gray-500">Redirect URL after a successful payment.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">cancelUrl</td>
                  <td className="py-2 px-3 text-gray-500">string (URL)</td>
                  <td className="py-2 px-3 text-emerald-600 font-medium">Yes</td>
                  <td className="py-2 px-3 text-gray-500">Redirect URL if the user cancels or payment fails.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">Example API Request</h3>
          <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-gray-400 font-medium">POST /api/v1/payment-session</span>
              <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Copy
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{`{
  "amount": 2220,
  "currency": "KES",
  "description": "Development work KE",
  "customer": {
    "name": "SAMUEL CHAGA",
    "email": "samtext454@gmail.com",
    "phone": "0712071385"
  },
  "successUrl": "https://your-store.com/order/success",
  "cancelUrl": "https://your-store.com/order/cancel",
  "metadata": {
    "orderId": "ORD-12345"
  }
}`}</code>
            </pre>
          </div>

          {/* ─── AUTHENTICATION CALLOUT ───────────────────────────── */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Authentication Required</p>
              <p className="text-sm text-amber-700">
                All API requests must include the following headers:{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">x-api-key</code>,{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">x-signature</code>,{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">x-timestamp</code>, and{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">x-nonce</code>.
                <br />
                See <Link href="/authentication" className="text-amber-800 underline font-medium hover:text-amber-900">Authentication</Link> for detailed instructions and code examples.
              </p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">Example Response</h3>
          <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-gray-400 font-medium">201 Created</span>
              <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Copy
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{`{
  "sessionId": "sess_abc123",
  "redirectUrl": "https://pay.xecoflow.com/pay/sess_abc123"
}`}</code>
            </pre>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            <strong>Note:</strong> The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">sessionId</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">redirectUrl</code> are unique to each payment. You must redirect the customer to the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">redirectUrl</code> to complete the payment.
          </p>
        </div>

        {/* ─── PAYMENT LINKS ────────────────────────────────────────── */}
        <div id="payment-links" className="scroll-mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
            Payment Links
          </h2>
          <p className="text-gray-500 mb-6">
            Payment Links are a no-code way to accept payments. You can create a payment link
            directly from the dashboard and share it via email, WhatsApp, SMS, or social media.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
              <li>Log in to your XecoFlow dashboard.</li>
              <li>Go to <strong>Products → Payment Links</strong>.</li>
              <li>Click <strong>Create Payment Link</strong>.</li>
              <li>Fill in the amount, description, and optional expiry date.</li>
              <li>Generate the link and copy it.</li>
              <li>Share the link with your customer – they click and pay.</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500">
            Payment Links are ideal for freelancers, consultants, and small businesses who
            want to collect payments quickly without any integration.
          </p>
        </div>

        {/* ─── Next Steps ────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Authentication →
              </Link>
              {' '}Learn how to authenticate your API requests.
            </li>
            <li>
              <Link href="/unified-gateway" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Unified Gateway →
              </Link>
              {' '}Explore all available actions and endpoints.
            </li>
            <li>
              <Link href="/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration with mock data.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}