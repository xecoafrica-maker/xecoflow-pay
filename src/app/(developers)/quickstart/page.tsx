// src/app/(developers)/quickstart/page.tsx
import Link from 'next/link';

export default function QuickStartPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Quick Start</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Quick Start Guide
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Follow this step‑by‑step guide to integrate XecoFlow payments into your application. 
          You'll have a working payment integration in under 10 minutes.
        </p>

        {/* Step 1 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          1. Create a XecoFlow Account
        </h2>
        <p className="text-gray-600 mb-4">
          Sign up for a free XecoFlow account to get your API keys. You can use the sandbox
          environment to test without handling real money.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
          <strong>Sandbox Base URL:</strong> <code className="bg-gray-200 px-2 py-0.5 rounded">https://sandbox.xecoflow.com</code><br />
          <strong>Production Base URL:</strong> <code className="bg-gray-200 px-2 py-0.5 rounded">https://api.xecoflow.com</code>
        </div>
        <p className="text-gray-600 mt-4">
          After signing up, navigate to the <strong>Developers</strong> section in your dashboard
          to create your first API key.
        </p>

        {/* Step 2 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          2. Get Your API Keys
        </h2>
        <p className="text-gray-600 mb-4">
          You'll need an <strong>API Key</strong> and an <strong>API Secret</strong> to authenticate
          your requests. Your API key identifies your account, while the secret is used to sign
          each request for security.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          ⚠️ <strong>Important:</strong> Never expose your API Secret in client‑side code or
          version control. Keep it secure on your server.
        </div>

        {/* Step 3 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          3. Install the XecoFlow SDK
        </h2>
        <p className="text-gray-600 mb-4">
          The XecoFlow SDK simplifies API integration. Choose your preferred language:
        </p>

        {/* Node.js */}
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`npm install @xecoflow/sdk`}</code>
          </pre>
        </div>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Python</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`pip install xecoflow-sdk`}</code>
          </pre>
        </div>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">PHP</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`composer require xecoflow/sdk`}</code>
          </pre>
        </div>

        {/* Step 4 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          4. Initialize the SDK
        </h2>
        <p className="text-gray-600 mb-4">
          Use your API key to initialize the SDK. For sandbox testing, set the environment to
          <code className="bg-gray-200 px-1.5 py-0.5 rounded">sandbox</code>.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const XecoFlow = require('@xecoflow/sdk');

const xecoflow = new XecoFlow({
  apiKey: 'sk_test_xxxxxxxxxxxx',
  apiSecret: 'xeco_secret_xxxxxxxxxxxx',
  environment: 'sandbox' // Change to 'production' when ready
});`}</code>
          </pre>
        </div>

        {/* Step 5 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          5. Make Your First Payment
        </h2>
        <p className="text-gray-600 mb-4">
          Now you're ready to process your first payment. Here's how to initiate an M‑PESA
          STK Push:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const payment = await xecoflow.payments.create({
  action: 'charge',
  method: 'mpesa',
  phone: '254708050827',
  amount: 10,
  shortcode: '7450249',
  idempotencyKey: 'test-' + Date.now()
});

console.log('Payment initiated:', payment);`}</code>
          </pre>
        </div>

        <p className="text-gray-600 mb-4">
          If successful, you'll receive a response containing a <code className="bg-gray-200 px-1.5 py-0.5 rounded">checkoutRequestId</code>.
          The customer will receive an STK push notification on their phone asking them to
          enter their M‑PESA PIN.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Response (Success)</span>
          </div>
          <pre className="p-4 text-sm text-emerald-400 overflow-x-auto">
            <code>{`{
  "success": true,
  "data": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "checkoutRequestId": "ws_CO_123456789"
  }
}`}</code>
          </pre>
        </div>

        {/* Step 6 */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          6. Handle Payment Notifications
        </h2>
        <p className="text-gray-600 mb-4">
          XecoFlow sends real‑time notifications (webhooks) when a payment succeeds or fails.
          Set up a webhook endpoint in your dashboard, and we'll POST JSON to that URL.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Webhook Payload</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`{
  "event": "payment.completed",
  "data": {
    "transactionId": "550e8400-...",
    "checkoutRequestId": "ws_CO_123456789",
    "amount": 10,
    "currency": "KES",
    "mpesaReceipt": "UFH6D8FFHQ",
    "phone": "254708050827",
    "status": "SUCCESS"
  }
}`}</code>
          </pre>
        </div>

        <p className="text-gray-600 mb-4">
          Your webhook endpoint must return a <code className="bg-gray-200 px-1.5 py-0.5 rounded">200 OK</code> response within 5 seconds.
          If you need to process the event asynchronously, acknowledge it immediately and
          process it in the background.
        </p>

        {/* Next Steps */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Next Steps
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Authentication →
              </Link>
              {' '}Learn more about API keys, HMAC signatures, and security best practices.
            </li>
            <li>
              <Link href="/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods →
              </Link>
              {' '}Explore all supported payment methods (M‑PESA, Airtel, cards, banks).
            </li>
            <li>
              <Link href="/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration using our sandbox credentials and test data.
            </li>
            <li>
              <Link href="/api-docs/reference" className="text-emerald-600 hover:text-emerald-700 font-medium">
                API Reference →
              </Link>
              {' '}Full API documentation with request/response examples.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}