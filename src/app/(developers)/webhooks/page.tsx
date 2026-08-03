// src/app/(developers)/webhooks/page.tsx
import Link from 'next/link';

export default function WebhooksPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/developers" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Webhooks</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Webhooks
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Webhooks allow your application to receive real-time notifications about payment events.
          Instead of polling the API for updates, XecoFlow will send HTTP requests to your configured
          endpoint whenever a payment succeeds, fails, or changes status.
        </p>

        {/* ─── How It Works ───────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          How Webhooks Work
        </h2>

        <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-8 pl-4">
          <li>You configure a webhook URL in the XecoFlow dashboard.</li>
          <li>When a payment event occurs (e.g., a customer completes an M-PESA payment), XecoFlow sends a POST request to your URL.</li>
          <li>Your server receives the payload, verifies the signature, and processes the event (e.g., updates your database).</li>
          <li>Your server responds with a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">200 OK</code> to acknowledge receipt.</li>
          <li>If you don't respond within 10 seconds, XecoFlow retries up to 3 times.</li>
        </ol>

        {/* ─── Configuring Webhooks ───────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Configuring Webhooks
        </h2>

        <p className="text-gray-500 mb-6">
          You can manage your webhook endpoints from the <Link href="/dashboard/developers" className="text-emerald-600 hover:text-emerald-700 font-medium">API & Webhooks</Link> section of your dashboard:
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 pl-4">
            <li>Navigate to <strong>API & Webhooks</strong> in the sidebar.</li>
            <li>Scroll to the <strong>Webhooks</strong> section.</li>
            <li>Enter your endpoint URL (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">https://your-app.com/webhooks/xecoflow</code>).</li>
            <li>Click <strong>Save Webhook Settings</strong>.</li>
            <li>Optionally, enable or disable the webhook using the toggle.</li>
          </ol>
          <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <span className="text-amber-500">⚠️</span>
            <span>
              Your endpoint must be <strong>publicly accessible</strong> and use HTTPS in production.
              XecoFlow does not support localhost URLs (use a service like ngrok for testing).
            </span>
          </div>
        </div>

        {/* ─── Event Types ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Event Types
        </h2>

        <p className="text-gray-500 mb-6">
          XecoFlow sends webhooks for the following events:
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Event</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Payload Includes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">payment.success</td>
                <td className="py-3 px-4 text-gray-500">A payment was successfully completed</td>
                <td className="py-3 px-4 text-gray-500">transactionId, amount, method, customer details</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">payment.failed</td>
                <td className="py-3 px-4 text-gray-500">A payment failed (insufficient balance, timeout, etc.)</td>
                <td className="py-3 px-4 text-gray-500">transactionId, error code, error message</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">payment.pending</td>
                <td className="py-3 px-4 text-gray-500">A payment is pending (waiting for customer action)</td>
                <td className="py-3 px-4 text-gray-500">transactionId, checkoutRequestId, status</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">payment.refunded</td>
                <td className="py-3 px-4 text-gray-500">A payment was refunded</td>
                <td className="py-3 px-4 text-gray-500">originalTransactionId, refundAmount, refundReason</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">settlement.completed</td>
                <td className="py-3 px-4 text-gray-500">A settlement batch was completed</td>
                <td className="py-3 px-4 text-gray-500">settlementId, totalAmount, transactionIds</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-sm text-gray-800">customer.created</td>
                <td className="py-3 px-4 text-gray-500">A new customer was registered</td>
                <td className="py-3 px-4 text-gray-500">customerId, email, phone, name</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Webhook Payload ────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Webhook Payload
        </h2>

        <p className="text-gray-500 mb-6">
          Each webhook request includes a JSON body with the following structure:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Example Webhook Payload</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`{
  "event": "payment.success",
  "timestamp": "2026-06-28T15:19:07.587Z",
  "data": {
    "transactionId": "b665fb62-26d1-4467-9b53-b7092b57ffa3",
    "checkoutRequestId": "ws_CO_123456789",
    "amount": 500,
    "currency": "KES",
    "method": "mpesa",
    "phone": "254712345678",
    "shortcode": "7450249",
    "reference": "order-123-abc",
    "status": "completed",
    "completedAt": "2026-06-28T15:19:15.123Z"
  },
  "signature": "2a4b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7",
  "correlationId": "d97d4f81-c191-4920-a08c-c61638cfdb14"
}`}</code>
          </pre>
        </div>

        {/* ─── Verifying Webhook Signatures ───────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Verifying Webhook Signatures
        </h2>

        <p className="text-gray-500 mb-6">
          To ensure that webhooks are genuinely sent by XecoFlow (and not by an attacker), you should verify the
          signature included in the webhook request. The signature is generated using the same HMAC-SHA256 algorithm
          as API authentication, but with a <strong>dedicated webhook secret</strong> (provided in your dashboard).
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-3">How to Verify</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
            <li>Get your webhook secret from the dashboard (under API &amp; Webhooks).</li>
            <li>
              Compute the HMAC-SHA256 signature of the <strong>entire raw JSON body</strong> (not just the data) using your webhook secret.
            </li>
            <li>Compare the computed signature with the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-webhook-signature</code> header.</li>
            <li>If they match, the webhook is genuine. Process the payload.</li>
          </ol>
        </div>

        {/* Code Example */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Node.js</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js (Express)</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const crypto = require('crypto');

// Your webhook secret (stored in environment variables)
const WEBHOOK_SECRET = process.env.XECOFLOW_WEBHOOK_SECRET;

app.post('/webhooks/xecoflow', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const rawBody = JSON.stringify(req.body);

  // Compute HMAC-SHA256 of the raw body
  const computed = crypto.createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (computed !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Signature is valid – process the webhook
  const { event, data } = req.body;
  console.log(\`Received webhook: \${event}\`, data);

  // Acknowledge receipt
  res.status(200).json({ received: true });
});`}</code>
          </pre>
        </div>

        {/* ─── Retry Logic ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Retry Logic
        </h2>

        <p className="text-gray-500 mb-6">
          XecoFlow will retry webhook delivery if your endpoint:
        </p>

        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-8 pl-4">
          <li>Returns a non-200 status code (e.g., 500, 404)</li>
          <li>Does not respond within 10 seconds</li>
          <li>Is temporarily unreachable (network error)</li>
        </ul>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Retry Schedule:</span>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• 1st retry: after 30 seconds</li>
                <li>• 2nd retry: after 5 minutes</li>
                <li>• 3rd retry: after 1 hour</li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-gray-700">Best Practices:</span>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Respond with <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">200 OK</code> as soon as possible</li>
                <li>• Process the webhook asynchronously (e.g., use a queue)</li>
                <li>• Log all incoming webhooks for debugging</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Testing Webhooks ───────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Testing Webhooks
        </h2>

        <p className="text-gray-500 mb-6">
          During development, you can test webhooks using the <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">Sandbox Environment</Link>.
          The sandbox will send mock webhook events to your configured endpoint, allowing you to test your integration
          without using real money.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-amber-800 mb-2">💡 Pro Tip</h4>
          <p className="text-sm text-amber-700">
            Use tools like <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline hover:text-amber-900">ngrok</a> to expose your local development server to the internet, so XecoFlow can send webhooks to your local machine during testing.
          </p>
        </div>

        {/* ─── Next Steps ────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/developers/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods →
              </Link>
              {' '}Explore all supported payment methods
            </li>
            <li>
              <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration safely
            </li>
            <li>
              <Link href="/developers/best-practices" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Best Practices →
              </Link>
              {' '}Security, idempotency, and more
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}