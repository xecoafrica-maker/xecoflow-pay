// src/app/(developers)/best-practices/page.tsx
import Link from 'next/link';

export default function BestPracticesPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/developers" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Best Practices</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Best Practices
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Following these best practices will help you build a secure, reliable, and scalable integration
          with the XecoFlow payment gateway. Whether you're just starting or already in production, these
          guidelines will prevent common pitfalls and ensure smooth operations.
        </p>

        {/* ─── Security ────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          1. Security
        </h2>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Never expose your API secret</h4>
            <p className="text-sm text-gray-500">
              Store your API secret and webhook secret in environment variables, never in your codebase.
              Use a secrets manager for production environments.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Always use HTTPS</h4>
            <p className="text-sm text-gray-500">
              XecoFlow requires HTTPS in production. Never send sensitive data over HTTP.
              Use <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">sandbox</Link> for local testing.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Validate webhook signatures</h4>
            <p className="text-sm text-gray-500">
              Always verify the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-webhook-signature</code> header before processing any webhook.
              This prevents fraud and ensures the request is genuinely from XecoFlow.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Rotate keys regularly</h4>
            <p className="text-sm text-gray-500">
              Generate new API keys periodically (e.g., every 90 days) to limit exposure.
              Revoke old keys after rotation. Use the dashboard's key management features.
            </p>
          </div>
        </div>

        {/* ─── Idempotency ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          2. Idempotency
        </h2>

        <p className="text-gray-500 mb-4">
          Idempotency ensures that a request can be safely retried without causing duplicate transactions.
          This is critical for payment operations like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">charge</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">send</code>, and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">refund</code>.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-3">How to Use Idempotency Keys</h4>
          <ul className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
            <li>
              Generate a unique key for each request (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">order-123-abc</code>).
            </li>
            <li>
              Include the key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">idempotencyKey</code> field of your request body.
            </li>
            <li>
              If you retry the same request with the same key, XecoFlow will return the cached result
              without processing the payment again.
            </li>
          </ul>
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <span className="text-amber-500">⚠️</span>
            <span>
              Idempotency keys are <strong>required</strong> for charge, send, and refund operations.
              Use a deterministic format (e.g., <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">order-{'{orderId}'}-{'{timestamp}'}</code>) to avoid collisions.
            </span>
          </div>
        </div>

        {/* ─── Environment Variables ─────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          3. Environment Variables
        </h2>

        <p className="text-gray-500 mb-6">
          Store all sensitive configuration in environment variables. Never hard-code credentials.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">.env Example</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`# XecoFlow Configuration
XECOFLOW_API_KEY=sk_live_xxxx
XECOFLOW_API_SECRET=xeco_secret_xxxx
XECOFLOW_WEBHOOK_SECRET=whsec_xxxx
XECOFLOW_BASE_URL=https://api.xecoflow.com

# Optional
XECOFLOW_SANDBOX=true
XECOFLOW_TIMEOUT=30000`}</code>
          </pre>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-emerald-500">✅</span>
            <span><strong>Best practice:</strong> Use different environment variables for development, staging, and production.</span>
          </div>
        </div>

        {/* ─── Rate Limiting ──────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          4. Rate Limiting
        </h2>

        <p className="text-gray-500 mb-6">
          XecoFlow implements rate limits to protect the system from abuse. Different endpoints have different limits.
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Endpoint / Action</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Rate Limit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Window</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800">charge, send, refund</td>
                <td className="py-3 px-4 text-gray-500">30 requests</td>
                <td className="py-3 px-4 text-gray-500">60 seconds</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800">balance, register_urls, transactions, register_pull, receive</td>
                <td className="py-3 px-4 text-gray-500">60 requests</td>
                <td className="py-3 px-4 text-gray-500">60 seconds</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-800">status, verify</td>
                <td className="py-3 px-4 text-gray-500">120 requests</td>
                <td className="py-3 px-4 text-gray-500">60 seconds</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-800">General API</td>
                <td className="py-3 px-4 text-gray-500">100 requests</td>
                <td className="py-3 px-4 text-gray-500">60 seconds</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-amber-500">💡</span>
            <span>
              If you exceed the rate limit, you'll receive a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">429 Too Many Requests</code> response.
              Implement exponential backoff and retry after the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Retry-After</code> header.
            </span>
          </div>
        </div>

        {/* ─── Logging ────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          5. Logging
        </h2>

        <p className="text-gray-500 mb-4">
          Comprehensive logging is essential for debugging and auditing. Always log:
        </p>

        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-8 pl-4">
          <li>All outgoing requests (with <strong>redacted</strong> sensitive data)</li>
          <li>All incoming webhooks (with verification status)</li>
          <li>Errors and exceptions</li>
          <li>Idempotency keys and correlation IDs</li>
        </ul>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-2">Recommended Log Format</h4>
          <div className="bg-[#0b1220] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto">
            <code>{`{
  "level": "info",
  "timestamp": "2026-06-28T15:19:07.587Z",
  "correlationId": "d97d4f81-c191-4920-a08c-c61638cfdb14",
  "event": "payment.request",
  "action": "charge",
  "method": "mpesa",
  "amount": 500,
  "shortcode": "7450249",
  "status": "success"
}`}</code>
          </div>
        </div>

        {/* ─── Error Handling ────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          6. Error Handling
        </h2>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-amber-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Graceful Degradation</h4>
            <p className="text-sm text-gray-500">
              Always handle errors gracefully. If XecoFlow is unavailable, your application should
              display a friendly message and not crash. Consider implementing a fallback payment method.
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Retry with Backoff</h4>
            <p className="text-sm text-gray-500">
              For network errors and 5xx responses, implement an exponential backoff retry strategy
              (e.g., 1s, 2s, 4s, 8s). Don't retry on 4xx errors (client errors) unless they're idempotent.
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-4 py-2 bg-gray-50 rounded-r-xl">
            <h4 className="font-semibold text-gray-900">Timeout Configuration</h4>
            <p className="text-sm text-gray-500">
              Set reasonable timeouts (e.g., 30 seconds) for API calls. Avoid blocking your main thread
              while waiting for a response. Use async/await or callbacks.
            </p>
          </div>
        </div>

        {/* ─── Performance ────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          7. Performance
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">Use Connection Pooling</h4>
            <p className="text-sm text-gray-500">
              Reuse HTTP connections to reduce latency. Most HTTP clients support connection pooling by default.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">Cache Responses</h4>
            <p className="text-sm text-gray-500">
              Cache idempotent responses (e.g., balance queries) for a short time to reduce API calls.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">Batch Requests</h4>
            <p className="text-sm text-gray-500">
              Where possible, batch multiple operations into a single request (if supported).
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">Monitor Webhook Latency</h4>
            <p className="text-sm text-gray-500">
              Ensure your webhook handler responds quickly. If processing takes long, acknowledge the webhook immediately and process asynchronously.
            </p>
          </div>
        </div>

        {/* ─── Summary ────────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Summary Checklist
        </h2>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>API secret stored in environment variables, never in code</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>HTTPS enforced in production</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>Webhook signatures verified before processing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>Idempotency keys used for all charge, send, and refund requests</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>Rate limits respected with exponential backoff</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>Comprehensive logging with redacted sensitive data</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>Graceful error handling and retry logic</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">✅</span>
              <span>API keys rotated regularly</span>
            </div>
          </div>
        </div>

        {/* ─── Next Steps ────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/developers/api-docs/reference" className="text-emerald-600 hover:text-emerald-700 font-medium">
                API Reference →
              </Link>
              {' '}Full endpoint documentation
            </li>
            <li>
              <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration safely
            </li>
            <li>
              <Link href="/developers/faq" className="text-emerald-600 hover:text-emerald-700 font-medium">
                FAQ →
              </Link>
              {' '}Common questions and answers
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}