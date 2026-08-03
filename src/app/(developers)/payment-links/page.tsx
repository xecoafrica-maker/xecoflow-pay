// src/app/(developers)/payment-links/page.tsx
import Link from 'next/link';

export default function PaymentLinksPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <Link href="/payment-solutions" className="hover:text-gray-600">Payment Solutions</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Payment Links & Invoicing</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Payment Links & Invoicing
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          Payment Links let you create a unique, shareable URL for each transaction. Perfect for
          freelancers, consultants, and service businesses — send a link and get paid directly
          through M-PESA, Airtel Money, or card.
        </p>

        {/* How It Works */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          How Payment Links Work
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { step: '1', title: 'Create a Link', desc: 'From your dashboard, generate a payment link with a fixed amount and description.' },
            { step: '2', title: 'Share with Customer', desc: 'Send the link via WhatsApp, Email, SMS, or embed it in an invoice.' },
            { step: '3', title: 'Receive Payment', desc: 'Customer pays using their preferred method. You get notified instantly.' },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Creating a Payment Link */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Creating a Payment Link
        </h2>
        <p className="text-gray-600 mb-4">
          There are two ways to create a payment link — through the XecoFlow Dashboard or via the API.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Via Dashboard
        </h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Dashboard Steps</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`1. Go to Payment Pages → Create New
2. Fill in:
   - Title: "Website Design - John Doe"
   - Amount: 15000
   - Description: "Homepage redesign project"
3. Click "Create Payment Page"
4. Copy the generated link
5. Share with your customer`}</code>
          </pre>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
          Via API
        </h3>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Node.js Example</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const link = await xecoflow.paymentLinks.create({
  title: 'Website Design - John Doe',
  amount: 15000,
  description: 'Homepage redesign project',
  customerName: 'John Doe',
  customerPhone: '254712345678',
  reference: 'INV-2026-001'
});

console.log(link.url);
// => https://pay.xecoflow.com/pay/website-design-john-doe`}</code>
          </pre>
        </div>

        {/* Invoicing Features */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Invoicing Features
        </h2>
        <p className="text-gray-600 mb-4">
          Payment links double as simple invoices. Each link includes:
        </p>
        <div className="space-y-3 mb-6">
          {[
            'Customer name and contact details',
            'Invoice reference number for your records',
            'Payment amount and description',
            'Real-time payment status tracking',
            'Automatic receipt delivery via SMS and email',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Tracking Payments */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Tracking Payment Status
        </h2>
        <p className="text-gray-600 mb-4">
          Monitor the status of your payment links from the dashboard or via API:
        </p>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Check Link Status</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`const status = await xecoflow.paymentLinks.get('link-id');
console.log(status);
// => { paid: true, amount: 15000, paidAt: '2026-06-25T10:30:00Z' }`}</code>
          </pre>
        </div>

        {/* Webhooks */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Webhook Notifications
        </h2>
        <p className="text-gray-600 mb-4">
          Set up webhooks to receive real-time notifications when a payment link is paid:
        </p>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Webhook Payload</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`{
  "event": "payment_link.paid",
  "data": {
    "linkId": "link_abc123",
    "reference": "INV-2026-001",
    "amount": 15000,
    "currency": "KES",
    "customer": {
      "name": "John Doe",
      "phone": "254712345678"
    },
    "paidAt": "2026-06-25T10:30:00Z"
  }
}`}</code>
          </pre>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/ecommerce-plugins" className="text-emerald-600 hover:text-emerald-700 font-medium">
                E-commerce Plugins →
              </Link>
              {' '}Integrate XecoFlow with WooCommerce, Shopify, and more.
            </li>
            <li>
              <Link href="/features" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Features Overview →
              </Link>
              {' '}Explore recurring payments, fraud protection, and more.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}