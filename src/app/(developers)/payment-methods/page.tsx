// src/app/(developers)/payment-methods/page.tsx
import Link from 'next/link';

export default function PaymentMethodsPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Payment Methods & Currencies</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Payment Methods & Currencies
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          XecoFlow supports a wide range of payment methods across East Africa and globally.
          Each method is accessed through the same unified API — just change the{' '}
          <code className="bg-gray-200 px-1.5 py-0.5 rounded">method</code> parameter.
        </p>

        {/* Supported Methods Table */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Supported Payment Methods
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">API Value</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Currencies</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Settlement</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['M-PESA', 'mpesa', 'Mobile Money', 'KES', 'Instant'],
                ['Airtel Money', 'airtel', 'Mobile Money', 'KES, UGX, TZS', 'Instant'],
                ['Visa / Mastercard', 'card', 'Card', 'KES, USD, EUR, GBP', 'T+2'],
                ['PayPal', 'paypal', 'Digital Wallet', 'USD, EUR, GBP', 'T+2'],
                ['Stripe', 'stripe', 'Card Processor', 'USD, EUR, GBP', 'T+2'],
                ['Flutterwave', 'flutterwave', 'Pan-African', 'KES, UGX, TZS, RWF', 'T+1'],
                ['Bank Transfer', 'bank', 'EFT / RTGS', 'KES', 'T+1'],
                ['SACCO', 'sacco', 'Cooperative', 'KES', 'T+1'],
              ].map(([name, value, type, currencies, settlement]) => (
                <tr key={value} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{name}</td>
                  <td className="py-3 px-4">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">{value}</code>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{type}</td>
                  <td className="py-3 px-4 text-gray-500">{currencies}</td>
                  <td className="py-3 px-4 text-gray-500">{settlement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* M-PESA */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          M-PESA
        </h2>
        <p className="text-gray-600 mb-4">
          Safaricom's mobile money service. Supports STK Push (customer-initiated), C2B (paybill/till),
          and B2C (business-to-customer disbursement).
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">M-PESA STK Push Example</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const payment = await xecoflow.payments.create({
  action: 'charge',
  method: 'mpesa',
  phone: '254708050827',
  amount: 500,
  shortcode: '7450249',
  idempotencyKey: 'unique-key-123'
});`}</code>
          </pre>
        </div>

        {/* Airtel Money */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Airtel Money
        </h2>
        <p className="text-gray-600 mb-4">
          Airtel's mobile wallet. Works similarly to M-PESA with STK Push for customer payments.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Airtel Money Example</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const payment = await xecoflow.payments.create({
  action: 'charge',
  method: 'airtel',
  phone: '254708050827',
  amount: 500,
  shortcode: '7450249',
  idempotencyKey: 'unique-key-124'
});`}</code>
          </pre>
        </div>

        {/* Cards */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Visa / Mastercard
        </h2>
        <p className="text-gray-600 mb-4">
          Accept credit and debit cards. Requires the customer to enter their card details on our
          hosted payment page. PCI DSS Level 1 compliant.
        </p>

        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Card Payment Example</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const payment = await xecoflow.payments.create({
  action: 'charge',
  method: 'card',
  amount: 5000,
  currency: 'KES',
  shortcode: '7450249',
  idempotencyKey: 'unique-key-125',
  card: {
    number: '4111111111111111',
    expiry: '12/28',
    cvv: '123',
    name: 'John Doe'
  }
});`}</code>
          </pre>
        </div>

        {/* Common Request Parameters */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Common Request Parameters
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Parameter</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Required</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['action', 'string', 'Yes', 'The operation: charge, send, balance, status, verify'],
                ['method', 'string', 'Yes', 'Payment method: mpesa, airtel, card, paypal, etc.'],
                ['phone', 'string', 'For mobile money', 'Customer phone in international format (2547...)'],
                ['amount', 'number', 'For payments', 'Amount in the smallest currency unit (e.g., KES)'],
                ['shortcode', 'string', 'For M-PESA/Airtel', 'Your business Till or PayBill number'],
                ['idempotencyKey', 'string', 'For payments', 'Unique key to prevent duplicate charges'],
                ['currency', 'string', 'No', '3-letter ISO code. Default: KES'],
              ].map(([param, type, required, desc]) => (
                <tr key={param} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-800">{param}</td>
                  <td className="py-3 px-4 text-gray-500">{type}</td>
                  <td className="py-3 px-4 text-gray-500">{required}</td>
                  <td className="py-3 px-4 text-gray-500">{desc}</td>
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
              <Link href="/payment-solutions" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Solutions →
              </Link>
              {' '}Explore hosted payment pages, payment links, and invoicing.
            </li>
            <li>
              <Link href="/authentication" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Authentication →
              </Link>
              {' '}Secure your API requests with HMAC signatures.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}