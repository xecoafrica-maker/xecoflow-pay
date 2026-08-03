// src/app/(developers)/sandbox/page.tsx
import Link from 'next/link';

export default function SandboxPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Sandbox & Test Credentials</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Sandbox & Test Credentials
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          The XecoFlow sandbox is a fully functional test environment that mimics the production
          API without moving real money. Use it to build, test, and debug your integration before
          going live.
        </p>

        {/* Sandbox vs Production */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Sandbox vs Production
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Feature</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Sandbox</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Production</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Base URL', 'https://sandbox.xecoflow.com', 'https://api.xecoflow.com'],
                ['API Keys', 'sk_test_...', 'sk_live_...'],
                ['Money Movement', 'Simulated (no real KES)', 'Real money moved'],
                ['STK Push', 'No actual push sent', 'Customer receives push'],
                ['Rate Limits', 'Higher limits for testing', 'Standard limits apply'],
                ['Webhooks', 'Fully functional', 'Fully functional'],
              ].map(([feature, sandbox, production]) => (
                <tr key={feature} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{feature}</td>
                  <td className="py-3 px-4 text-gray-500">{sandbox}</td>
                  <td className="py-3 px-4 text-gray-500">{production}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Getting Sandbox Credentials */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Getting Your Sandbox Credentials
        </h2>
        <p className="text-gray-600 mb-4">
          When you create a XecoFlow account, sandbox API keys are automatically generated.
          Follow these steps to find them:
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 mb-6">
          <li>Log in to your <Link href="/login" className="text-emerald-600 font-medium">XecoFlow Dashboard</Link></li>
          <li>Navigate to <strong>Settings → API Keys</strong></li>
          <li>Copy your <strong>Sandbox API Key</strong> (starts with <code className="bg-gray-200 px-1.5 py-0.5 rounded">sk_test_</code>)</li>
          <li>Copy your <strong>API Secret</strong> (starts with <code className="bg-gray-200 px-1.5 py-0.5 rounded">xeco_secret_</code>)</li>
        </ol>

        {/* Test Credentials */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Test Data
        </h2>
        <p className="text-gray-600 mb-4">
          Use the following test data to simulate various payment scenarios in the sandbox:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Test Phone Numbers</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`// Successful payment
phone: '254708050827'

// Insufficient funds (simulates failure)
phone: '254700000000'

// Customer cancelled
phone: '254711111111'

// Timeout simulation
phone: '254722222222'`}</code>
          </pre>
        </div>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Test Shortcodes</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`// Valid PayBill (7450249)
shortcode: '7450249'

// Valid Till Number (4938110)
shortcode: '4938110'

// Invalid shortcode (triggers error)
shortcode: '0000000'`}</code>
          </pre>
        </div>

        {/* Simulating Responses */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Simulating Payment Responses
        </h2>
        <p className="text-gray-600 mb-4">
          The sandbox automatically simulates payment outcomes based on the test phone number
          you use. You can also manually trigger webhook events from the dashboard.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Manual Webhook Testing</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
            <li>Go to <strong>Developers → Webhooks</strong> in your dashboard</li>
            <li>Click <strong>Send Test Event</strong></li>
            <li>Select an event type (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded">payment.completed</code>)</li>
            <li>A sample payload will be sent to your webhook endpoint</li>
          </ol>
        </div>

        {/* SDK Configuration */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          SDK Sandbox Configuration
        </h2>
        <p className="text-gray-600 mb-4">
          To use the sandbox environment, set the environment option to <code className="bg-gray-200 px-1.5 py-0.5 rounded">sandbox</code>
          when initializing the SDK:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const xecoflow = new XecoFlow({
  apiKey: 'sk_test_xxxxxxxxxxxx',
  apiSecret: 'xeco_secret_xxxxxxxxxxxx',
  environment: 'sandbox' // Use 'production' when ready
});

// All subsequent calls will use the sandbox endpoint`}</code>
          </pre>
        </div>

        {/* Testing Checklist */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Testing Checklist
        </h2>
        <p className="text-gray-600 mb-4">
          Before going live, ensure you've tested these scenarios in the sandbox:
        </p>
        <div className="space-y-3 mb-6">
          {[
            'Successful M‑PESA payment',
            'Failed payment (insufficient funds)',
            'Customer cancelled transaction',
            'Timeout handling',
            'Webhook delivery and signature verification',
            'Idempotency — same key returns same result',
            'Invalid API key returns 401',
            'Invalid signature returns 401',
            'Rate limiting returns 429',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Authentication →
              </Link>
              {' '}Learn how to secure your API requests with HMAC signatures.
            </li>
            <li>
              <Link href="/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods →
              </Link>
              {' '}Explore all payment methods available for integration.
            </li>
            <li>
              <Link href="/merchant-account" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Get a Merchant Account →
              </Link>
              {' '}Upgrade to a production account and start accepting real payments.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}