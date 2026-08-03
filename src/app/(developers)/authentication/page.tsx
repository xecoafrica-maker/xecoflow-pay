// src/app/(developers)/authentication/page.tsx
import Link from 'next/link';

export default function AuthenticationPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/developers" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Authentication</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Authentication
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Every API request to XecoFlow must be authenticated using a combination of
          <strong> API Key</strong> and <strong>HMAC-SHA256 signature</strong>.
          This ensures that only authorised applications can initiate payments and
          that requests haven't been tampered with in transit.
        </p>

        {/* Quick Overview */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <h4 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3">
            Quick Overview
          </h4>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Headers Required:</span>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">x-api-key</code></li>
                <li>• <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">x-signature</code></li>
                <li>• <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">x-timestamp</code></li>
                <li>• <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs">x-nonce</code></li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-gray-700">Signature Algorithm:</span>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• HMAC-SHA256</li>
                <li>• Sorted JSON body</li>
                <li>• API secret as key</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Headers ──────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Required Headers
        </h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Header</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">x-api-key</td>
                <td className="py-3 px-4 text-gray-500">Your API key (provided in the dashboard)</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-500">sk_live_Qevx-fi9iOg...</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">x-signature</td>
                <td className="py-3 px-4 text-gray-500">HMAC-SHA256 of the sorted JSON body</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-500">e5e100632a61b7ed...</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-mono text-sm text-gray-800">x-timestamp</td>
                <td className="py-3 px-4 text-gray-500">Current Unix timestamp (seconds)</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-500">1783756785</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-sm text-gray-800">x-nonce</td>
                <td className="py-3 px-4 text-gray-500">Unique 32-character hex string per request</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-500">5507bbc4de190a182d3196...</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Signature Generation ────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Generating the Signature
        </h2>

        <p className="text-gray-500 mb-6">
          The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">x-signature</code> header is computed using HMAC-SHA256.
          Here's the step-by-step process:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-8 pl-4">
          <li>Build your request body as a JSON object.</li>
          <li>
            Sort all keys <strong>alphabetically</strong> (including nested objects).
          </li>
          <li>Stringify the sorted object into a JSON string <strong>without spaces</strong>.</li>
          <li>
            Compute the HMAC-SHA256 digest of the string using your <strong>API secret</strong> as the key.
          </li>
          <li>The resulting hex string is your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">x-signature</code>.</li>
        </ol>

        {/* ─── Real World Example ───────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Real World Example
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Test Merchant Credentials:</strong>
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Merchant ID:</span>
              <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-xs">250012</code>
            </div>
            <div>
              <span className="font-medium text-gray-700">API Key:</span>
              <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-xs">sk_live_Qevx-fi9iOgYKvG...</code>
            </div>
            <div>
              <span className="font-medium text-gray-700">API Secret:</span>
              <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-xs">xeco_secret_lToXXNnQdOCK...</code>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-xs">254708050827</code>
            </div>
          </div>
        </div>

        {/* ─── Code Examples ────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Code Examples
        </h2>

        {/* Node.js */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Node.js</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js (CommonJS)</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const crypto = require('crypto');

// ⚠️ Replace with your actual credentials from the dashboard
const apiSecret = 'xeco_secret_lToXXNnQdOCKkfnedOpCLG04yUpnc0XUz3CiYR7UhQo';

// 1. Build your request body
const body = {
  action: 'charge',
  method: 'mpesa',
  phone: '254708050827',
  amount: 10,
  shortcode: '250012',
  idempotencyKey: 'key-' + crypto.randomBytes(8).toString('hex')
};

// 2. Sort keys alphabetically
const sorted = {};
Object.keys(body).sort().forEach(k => sorted[k] = body[k]);

// 3. Stringify without spaces
const bodyString = JSON.stringify(sorted);

// 4. Compute HMAC-SHA256 signature
const signature = crypto.createHmac('sha256', apiSecret)
  .update(bodyString)
  .digest('hex');

// 5. Generate timestamp and nonce
const timestamp = Math.floor(Date.now() / 1000);
const nonce = crypto.randomBytes(16).toString('hex');

console.log('x-api-key: sk_live_Qevx-fi9iOgYKvGQeyfB3EucfOOiRdfETs7ziE9M3n8');
console.log('x-signature:', signature);
console.log('x-timestamp:', timestamp);
console.log('x-nonce:', nonce);
console.log('Body:', bodyString);`}</code>
          </pre>
        </div>

        {/* PowerShell */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">PowerShell</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">PowerShell 7+</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`# Generate fresh values
node -e "
const timestamp = Math.floor(Date.now() / 1000);
const nonce = require('crypto').randomBytes(16).toString('hex');
const idempotencyKey = 'key-' + require('crypto').randomBytes(8).toString('hex');
console.log('x-timestamp:', timestamp);
console.log('x-nonce:', nonce);
console.log('idempotencyKey:', idempotencyKey);
"

# Generate signature
node -e "
const crypto = require('crypto');
const apiSecret = 'xeco_secret_lToXXNnQdOCKkfnedOpCLG04yUpnc0XUz3CiYR7UhQo';
const body = {
    action: 'charge',
    method: 'mpesa',
    phone: '254708050827',
    amount: 10,
    shortcode: '250012',
    idempotencyKey: '<YOUR_IDEMPOTENCY_KEY>'
};
const sorted = {};
Object.keys(body).sort().forEach(k => sorted[k] = body[k]);
const bodyString = JSON.stringify(sorted);
const signature = crypto.createHmac('sha256', apiSecret).update(bodyString).digest('hex');
console.log('x-signature:', signature);
"

# Send request
$body = @{
    action = 'charge'
    method = 'mpesa'
    phone = '254708050827'
    amount = 10
    shortcode = '250012'
    idempotencyKey = '<YOUR_IDEMPOTENCY_KEY>'
} | ConvertTo-Json

$headers = @{
    'x-api-key' = 'sk_live_Qevx-fi9iOgYKvGQeyfB3EucfOOiRdfETs7ziE9M3n8'
    'x-signature' = '<YOUR_SIGNATURE>'
    'x-timestamp' = '<YOUR_TIMESTAMP>'
    'x-nonce' = '<YOUR_NONCE>'
    'Content-Type' = 'application/json'
}

Invoke-RestMethod -Uri 'https://xecofLow-2gen.onrender.com/v1/payments' -Method Post -Headers $headers -Body $body`}</code>
          </pre>
        </div>

        {/* Python */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Python</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Python 3</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`import hmac
import hashlib
import json
import time
import secrets

api_secret = 'xeco_secret_lToXXNnQdOCKkfnedOpCLG04yUpnc0XUz3CiYR7UhQo'

# 1. Build your request body
body = {
    "action": "charge",
    "method": "mpesa",
    "phone": "254708050827",
    "amount": 10,
    "shortcode": "250012",
    "idempotencyKey": f"key-{secrets.token_hex(8)}"
}

# 2. Sort keys alphabetically
sorted_body = {k: body[k] for k in sorted(body.keys())}

# 3. Stringify without spaces
body_string = json.dumps(sorted_body, separators=(',', ':'))

# 4. Compute HMAC-SHA256 signature
signature = hmac.new(
    api_secret.encode('utf-8'),
    body_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

print(f'x-api-key: sk_live_Qevx-fi9iOgYKvGQeyfB3EucfOOiRdfETs7ziE9M3n8')
print(f'x-signature: {signature}')
print(f'x-timestamp: {int(time.time())}')
print(f'x-nonce: {secrets.token_hex(16)}')
print(f'Body: {body_string}')`}</code>
          </pre>
        </div>

        {/* cURL */}
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">cURL</h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">cURL (bash)</span>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Copy
            </button>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`curl -X POST https://xecofLow-2gen.onrender.com/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_live_Qevx-fi9iOgYKvGQeyfB3EucfOOiRdfETs7ziE9M3n8" \\
  -H "x-signature: e5e100632a61b7eda8c5070be7899b6f81a12d0b0517368b84f13630b3a701ae" \\
  -H "x-timestamp: 1783756785" \\
  -H "x-nonce: 5507bbc4de190a182d3196c3bf65170c" \\
  -d '{
    "action": "charge",
    "method": "mpesa",
    "phone": "254708050827",
    "amount": 10,
    "shortcode": "250012",
    "idempotencyKey": "key-4ebaf73ab7e7d14b"
  }'`}</code>
          </pre>
        </div>

        {/* ─── Security Best Practices ───────────────────────────────── */}
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Security Best Practices
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              title: 'Never expose your API secret',
              description: 'Store it in environment variables, not in your codebase.',
            },
            {
              title: 'Use HTTPS',
              description: 'Always use HTTPS in production. XecoFlow rejects non-HTTPS requests.',
            },
            {
              title: 'Rotate keys regularly',
              description: 'Periodically regenerate your API keys to limit exposure.',
            },
            {
              title: 'Validate callback signatures',
              description: 'Always verify webhook signatures to prevent fraud.',
            },
          ].map((tip) => (
            <div
              key={tip.title}
              className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all"
            >
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</h4>
              <p className="text-sm text-gray-500">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* ─── Next Steps ────────────────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/developers/quickstart" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Quick Start Guide →
              </Link>
              {' '}Start making your first API call
            </li>
            <li>
              <Link href="/developers/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sandbox Environment →
              </Link>
              {' '}Test your integration with mock endpoints
            </li>
            <li>
              <Link href="/developers/unified-gateway" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Unified Gateway →
              </Link>
              {' '}Learn about all available actions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}