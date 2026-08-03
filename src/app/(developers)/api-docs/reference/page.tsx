// src/app/(developers)/api-docs/reference/page.tsx
import Link from 'next/link';

export default function ApiReferencePage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/developers" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">API Reference</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        API Reference
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Complete reference for all XecoFlow API endpoints. All requests require authentication
          using the headers described in the <Link href="/developers/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">Authentication</Link> guide.
        </p>

        {/* ─── Base URL ────────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Base URL:</span>
            <code className="text-sm font-mono bg-white px-3 py-1 rounded border border-gray-200">https://api.xecoflow.com</code>
            <span className="text-xs text-gray-400">(sandbox: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">https://sandbox-api.xecoflow.com</code>)</span>
          </div>
        </div>

        {/* ─── Unified Gateway ────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Unified Gateway
        </h2>

        <p className="text-gray-500 mb-4">
          The single endpoint for all payment operations. Use the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">action</code> field to specify the operation.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
            <code className="text-lg font-mono text-gray-800">/v1/payments</code>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {[
            {
              action: 'charge',
              description: 'Initiate a payment from a customer (STK Push)',
              fields: ['phone (string, required)', 'amount (number, required)', 'shortcode (string, required)', 'idempotencyKey (string, required)'],
              response: '{ success: true, data: { transactionId, checkoutRequestId } }',
            },
            {
              action: 'send',
              description: 'Send money to a customer (B2C)',
              fields: ['phone (string, required)', 'amount (number, required)', 'shortcode (string, required)', 'idempotencyKey (string, required)'],
              response: '{ success: true, data: { transactionId } }',
            },
            {
              action: 'balance',
              description: 'Check account balance',
              fields: ['shortcode (string, required)'],
              response: '{ success: true, data: { balance, currency } }',
            },
            {
              action: 'status',
              description: 'Check transaction status',
              fields: ['shortcode (string, required)', 'transactionId (string, required)'],
              response: '{ success: true, data: { status, amount, method, ... } }',
            },
            {
              action: 'refund',
              description: 'Reverse a previous transaction',
              fields: ['amount (number, required)', 'shortcode (string, required)', 'transactionId (string, required)', 'idempotencyKey (string, required)'],
              response: '{ success: true, data: { refundId, status } }',
            },
            {
              action: 'register_urls',
              description: 'Register C2B validation/confirmation URLs',
              fields: ['shortcode (string, required)'],
              response: '{ success: true, message: "URLs registered" }',
            },
            {
              action: 'transactions',
              description: 'Pull C2B transaction history for a date range',
              fields: ['shortcode (string, required)', 'from (string, optional)', 'to (string, optional)'],
              response: '{ success: true, data: [ { transactionId, amount, phone, ... } ] }',
            },
            {
              action: 'register_pull',
              description: 'Register for Pull Transactions API',
              fields: ['shortcode (string, required)'],
              response: '{ success: true, message: "Pull registration successful" }',
            },
            {
              action: 'verify',
              description: 'Verify a PayBill or Till number',
              fields: [],
              response: '{ success: true, data: { valid, shortcode, name } }',
            },
            {
              action: 'receive',
              description: 'Register to receive payments via PayBill/Till',
              fields: ['shortcode (string, required)'],
              response: '{ success: true, message: "Registration successful" }',
            },
          ].map((op) => (
            <div key={op.action} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-sm font-mono font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                  {op.action}
                </code>
              </div>
              <p className="text-sm text-gray-500 mb-2">{op.description}</p>
              <div className="text-xs text-gray-400">
                <span className="font-medium">Fields:</span>{' '}
                {op.fields.length > 0 ? (
                  op.fields.map((f) => (
                    <code key={f} className="bg-gray-100 px-1.5 py-0.5 rounded ml-1">{f}</code>
                  ))
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <span className="font-medium">Response:</span>{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{op.response}</code>
              </div>
            </div>
          ))}
        </div>

        {/* ─── STK Push ────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          STK Push (M-PESA)
        </h2>

        <p className="text-gray-500 mb-4">
          Direct endpoints for STK Push operations. These are also covered by the unified gateway.
        </p>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/stk/push</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Initiate an STK Push payment. Requires: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">phone</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">amount</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">shortcode</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">idempotencyKey</code>.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/stk/status/:checkoutRequestId</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Query the status of an STK push request using the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">checkoutRequestId</code>.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/stk/callback</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Safaricom callback endpoint for STK push results (not called by merchants).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/stk/mock-push</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Mock endpoint for sandbox testing – no real money involved.</p>
          </div>
        </div>

        {/* ─── C2B ────────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          C2B (Customer to Business)
        </h2>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/c2b/validation</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Safaricom validation endpoint for C2B payments (not called by merchants).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/c2b/confirmation</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Safaricom confirmation endpoint for C2B payments (not called by merchants).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/c2b/transactions</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Retrieve C2B transaction history.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/c2b/summary</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Get a summary of C2B transactions.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/c2b/health</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Health check for C2B module.</p>
          </div>
        </div>

        {/* ─── B2C ────────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          B2C (Business to Customer)
        </h2>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/b2c/send</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Send money to a customer. Requires: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">phone</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">amount</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">shortcode</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">idempotencyKey</code>.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/b2c/status/:transactionId</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Check B2C transaction status.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/b2c/transactions</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Retrieve B2C transaction history.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/b2c/health</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Health check for B2C module.</p>
          </div>
        </div>

        {/* ─── Other Modules ──────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Other Modules
        </h2>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/accountbalance/query</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Check account balance (legacy – use unified gateway).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/transactionstatus/query</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Query transaction status (legacy – use unified gateway).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/queryorginfo/query</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Query organisation info.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/pulltransactions/register</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Register for pull transactions.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/pulltransactions/query</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Query pulled transactions.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">POST</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/payments/dynamicqr/generate</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Generate a dynamic M-PESA QR code.</p>
          </div>
        </div>

        {/* ─── Health & Info ──────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Health & Information
        </h2>

        <div className="space-y-3 mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/health</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Service health status.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/ready</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Readiness check (for load balancers).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/live</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Liveness check (for monitoring).</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">GET</span>
              <code className="text-sm font-mono text-gray-800">/api/v1/info</code>
            </div>
            <p className="text-xs text-gray-500 mt-2">Service information (version, features).</p>
          </div>
        </div>

        {/* ─── Error Codes ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Error Codes
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
                <td className="py-3 px-4 text-gray-500">Too many requests</td>
                <td className="py-3 px-4 text-gray-500">429</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">INSUFFICIENT_BALANCE</td>
                <td className="py-3 px-4 text-gray-500">Not enough balance</td>
                <td className="py-3 px-4 text-gray-500">402</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">INTERNAL_ERROR</td>
                <td className="py-3 px-4 text-gray-500">Internal server error</td>
                <td className="py-3 px-4 text-gray-500">500</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Next Steps ────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/developers/quickstart" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Quick Start Guide →
              </Link>
              {' '}Make your first API call
            </li>
            <li>
              <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test safely
            </li>
            <li>
              <Link href="/developers/faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
                FAQ →
              </Link>
              {' '}Common questions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}