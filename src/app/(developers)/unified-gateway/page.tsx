// src/app/(developers)/unified-gateway/page.tsx
import Link from 'next/link';

export default function UnifiedGatewayPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/developers" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Unified Gateway</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Unified Gateway
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          The XecoFlow Unified Gateway is a single endpoint that handles all payment operations —
          from initiating charges to checking balances and processing refunds. Instead of
          integrating multiple endpoints, you only need to learn one API.
        </p>

        {/* ─── Endpoint ────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Endpoint
        </h2>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">
              POST
            </span>
            <code className="text-lg font-mono text-gray-800">/v1/payments</code>
            <span className="text-sm text-gray-400 ml-2">Production</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Sandbox:</span>{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">https://sandbox-api.xecoflow.com/v1/payments</code>
          </div>
        </div>

        {/* ─── Request Structure ─────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Request Structure
        </h2>

        <p className="text-gray-500 mb-4">
          Every request to the Unified Gateway must include the following fields.
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Field</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Required</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">action</td>
                <td className="py-3 px-4 text-gray-500">string</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Yes</span>
                </td>
                <td className="py-3 px-4 text-gray-500">The operation to perform (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">charge</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">balance</code>)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">method</td>
                <td className="py-3 px-4 text-gray-500">string</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Yes</span>
                </td>
                <td className="py-3 px-4 text-gray-500">Payment method (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">mpesa</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">airtel</code>, etc.)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">phone</td>
                <td className="py-3 px-4 text-gray-500">string</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Conditional</span>
                </td>
                <td className="py-3 px-4 text-gray-500">Customer phone number (required for <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">charge</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code>)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">amount</td>
                <td className="py-3 px-4 text-gray-500">number</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Conditional</span>
                </td>
                <td className="py-3 px-4 text-gray-500">Amount in the smallest currency unit (required for <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">charge</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">refund</code>)</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">shortcode</td>
                <td className="py-3 px-4 text-gray-500">string</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Yes</span>
                </td>
                <td className="py-3 px-4 text-gray-500">Your merchant Paybill or Till number</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">idempotencyKey</td>
                <td className="py-3 px-4 text-gray-500">string</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Conditional</span>
                </td>
                <td className="py-3 px-4 text-gray-500">Unique key to prevent duplicate requests (required for <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">charge</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">refund</code>)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Available Actions ────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Available Actions
        </h2>

        <p className="text-gray-500 mb-6">
          The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">action</code> field determines what operation the gateway will perform.
          Here are all the supported actions:
        </p>

        <div className="space-y-4 mb-8">
          {[
            {
              action: 'charge',
              description: 'Initiate a payment from a customer (STK Push, Card, or Mobile Money).',
              requiresIdempotency: true,
              rateLimit: '30 per 60s',
              requiredFields: ['phone', 'amount', 'shortcode', 'idempotencyKey'],
            },
            {
              action: 'send',
              description: 'Send money to a customer (B2C disbursement).',
              requiresIdempotency: true,
              rateLimit: '30 per 60s',
              requiredFields: ['phone', 'amount', 'shortcode', 'idempotencyKey'],
            },
            {
              action: 'balance',
              description: 'Check your account balance.',
              requiresIdempotency: false,
              rateLimit: '60 per 60s',
              requiredFields: ['shortcode'],
            },
            {
              action: 'status',
              description: 'Check the status of a transaction.',
              requiresIdempotency: false,
              rateLimit: '120 per 60s',
              requiredFields: ['shortcode', 'transactionId'],
            },
            {
              action: 'refund',
              description: 'Reverse a previous transaction.',
              requiresIdempotency: true,
              rateLimit: '60 per 60s',
              requiredFields: ['amount', 'shortcode', 'transactionId', 'idempotencyKey'],
            },
            {
              action: 'register_urls',
              description: 'Register C2B validation and confirmation URLs.',
              requiresIdempotency: false,
              rateLimit: '60 per 60s',
              requiredFields: ['shortcode'],
            },
            {
              action: 'transactions',
              description: 'Pull C2B transaction history for a date range.',
              requiresIdempotency: false,
              rateLimit: '60 per 60s',
              requiredFields: ['shortcode'],
            },
            {
              action: 'register_pull',
              description: 'Register a shortcode for Pull Transactions API (one-time setup).',
              requiresIdempotency: false,
              rateLimit: '60 per 60s',
              requiredFields: ['shortcode'],
            },
            {
              action: 'verify',
              description: 'Verify a PayBill or Till number.',
              requiresIdempotency: false,
              rateLimit: '120 per 60s',
              requiredFields: [],
            },
            {
              action: 'receive',
              description: 'Register to receive payments via PayBill/Till.',
              requiresIdempotency: false,
              rateLimit: '60 per 60s',
              requiredFields: ['shortcode'],
            },
          ].map((action) => (
            <div
              key={action.action}
              className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-sm font-mono font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                      {action.action}
                    </code>
                    <span className="text-xs text-gray-400">
                      {action.rateLimit}
                    </span>
                    {action.requiresIdempotency && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Idempotent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{action.description}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="font-medium">Required fields:</span>{' '}
                    {action.requiredFields.length > 0 ? (
                      action.requiredFields.map((f) => (
                        <code key={f} className="bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                          {f}
                        </code>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Example Request ──────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Example Request
        </h2>

        <p className="text-gray-500 mb-6">
          Here's a complete example of a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">charge</code> request using M-PESA:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Request</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`POST /v1/payments
Host: api.xecoflow.com
Content-Type: application/json
x-api-key: sk_live_xxxx
x-signature: 2a4b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7
x-timestamp: 1719583200
x-nonce: 550e8400-e29b-41d4-a716-446655440000

{
  "action": "charge",
  "method": "mpesa",
  "phone": "254712345678",
  "amount": 500,
  "shortcode": "7450249",
  "idempotencyKey": "order-123-abc"
}`}</code>
          </pre>
        </div>

        {/* ─── Example Response ─────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Example Response
        </h2>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Response</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`{
  "success": true,
  "data": {
    "transactionId": "b665fb62-26d1-4467-9b53-b7092b57ffa3",
    "checkoutRequestId": "ws_CO_123456789"
  },
  "error": null,
  "correlationId": "d97d4f81-c191-4920-a08c-c61638cfdb14",
  "method": "mpesa",
  "action": "charge",
  "timestamp": "2026-06-28T15:19:07.587Z"
}`}</code>
          </pre>
        </div>

        {/* ─── Error Response ───────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Error Responses
        </h2>

        <p className="text-gray-500 mb-6">
          When an error occurs, the gateway returns a structured error response:
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Error Response</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key or signature",
    "details": "The x-signature header does not match the computed signature"
  },
  "correlationId": "d97d4f81-c191-4920-a08c-c61638cfdb14",
  "method": "mpesa",
  "action": "charge",
  "timestamp": "2026-06-28T15:19:07.587Z"
}`}</code>
          </pre>
        </div>

        {/* ─── Common Error Codes ───────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Common Error Codes
        </h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">HTTP Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">UNAUTHORIZED</td>
                <td className="py-3 px-4 text-gray-500">Invalid API key or signature</td>
                <td className="py-3 px-4 text-gray-500">401</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">INVALID_REQUEST</td>
                <td className="py-3 px-4 text-gray-500">Malformed request body or missing fields</td>
                <td className="py-3 px-4 text-gray-500">400</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">RATE_LIMIT_EXCEEDED</td>
                <td className="py-3 px-4 text-gray-500">Too many requests. Slow down.</td>
                <td className="py-3 px-4 text-gray-500">429</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">INSUFFICIENT_BALANCE</td>
                <td className="py-3 px-4 text-gray-500">Not enough balance to complete the transaction</td>
                <td className="py-3 px-4 text-gray-500">402</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-sm text-gray-800">INTERNAL_ERROR</td>
                <td className="py-3 px-4 text-gray-500">Something went wrong on our side</td>
                <td className="py-3 px-4 text-gray-500">500</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Code Examples ────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Code Examples
        </h2>

        {/* Node.js */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Node.js</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const crypto = require('crypto');

const apiSecret = 'xeco_secret_3fce2f6f1c7144e68b84acb2d9bb336a';

const body = {
  action: 'charge',
  method: 'mpesa',
  phone: '254712345678',
  amount: 500,
  shortcode: '7450249',
  idempotencyKey: 'order-123-abc'
};

// Sort keys and generate signature
const sorted = {};
Object.keys(body).sort().forEach(k => sorted[k] = body[k]);
const bodyString = JSON.stringify(sorted);

const signature = crypto.createHmac('sha256', apiSecret)
  .update(bodyString)
  .digest('hex');

const timestamp = Math.floor(Date.now() / 1000);
const nonce = crypto.randomUUID();

const response = await fetch('https://api.xecoflow.com/v1/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk_live_xxxx',
    'x-signature': signature,
    'x-timestamp': String(timestamp),
    'x-nonce': nonce,
  },
  body: bodyString,
});

const data = await response.json();
console.log(data);
// => { success: true, data: { transactionId: '...', checkoutRequestId: '...' } }`}</code>
          </pre>
        </div>

        {/* cURL */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">cURL</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">cURL</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`curl -X POST https://api.xecoflow.com/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_live_xxxx" \\
  -H "x-signature: 2a4b6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7" \\
  -H "x-timestamp: 1719583200" \\
  -H "x-nonce: 550e8400-e29b-41d4-a716-446655440000" \\
  -d '{
    "action": "charge",
    "method": "mpesa",
    "phone": "254712345678",
    "amount": 500,
    "shortcode": "7450249",
    "idempotencyKey": "order-123-abc"
  }'`}</code>
          </pre>
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
              <Link href="/developers/webhooks" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Webhooks →
              </Link>
              {' '}Configure real-time event notifications
            </li>
            <li>
              <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration safely
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}