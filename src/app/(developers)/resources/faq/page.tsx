// src/app/(developers)/resources/faq/page.tsx
import Link from 'next/link';

export default function FaqPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">FAQ</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Frequently Asked Questions
      </h1>

      <div className="prose prose-gray max-w-none">
        <div className="space-y-4">
          {[
            {
              q: 'How long does it take to integrate XecoFlow?',
              a: 'With our SDKs, you can be processing test payments in under 10 minutes. Full production integration typically takes 1-2 days depending on your requirements.',
            },
            {
              q: 'What payment methods does XecoFlow support?',
              a: 'We support M-PESA, Airtel Money, Visa, Mastercard, PayPal, Stripe, Flutterwave, bank transfers (EFT/RTGS), and SACCO payments — all through a single API.',
            },
            {
              q: 'How do I get my API keys?',
              a: 'Sign up for a XecoFlow account, then go to Settings → API Keys in your dashboard. Sandbox keys are available immediately. Production keys require business verification.',
            },
            {
              q: 'Where does the money go when a customer pays?',
              a: 'For Path B (Direct), money goes directly to your M-PESA Till or PayBill instantly. For Path A (Instant), money comes to our PayBill and is forwarded to your M-PESA within seconds.',
            },
            {
              q: 'How much does XecoFlow cost?',
              a: 'We charge a per-transaction fee: 1.5% for direct integration (Path B) and 2.5% for instant onboarding (Path A). There are no setup fees, monthly fees, or hidden charges.',
            },
            {
              q: 'Is XecoFlow secure?',
              a: 'Yes. We are PCI DSS Level 1 compliant, use AES-256-GCM encryption for credentials at rest, HMAC-SHA256 for request signing, and TLS 1.3 for all data in transit. We are regulated by the Central Bank of Kenya.',
            },
            {
              q: 'Can I test without real money?',
              a: 'Yes. Our sandbox environment lets you test with simulated payments. Use the provided test phone numbers and shortcodes to simulate success, failure, and timeout scenarios.',
            },
            {
              q: 'What happens if a payment fails?',
              a: 'You receive a webhook notification with the failure reason. For M-PESA, common reasons include insufficient funds, wrong PIN, or customer cancellation. The transaction status updates in your dashboard in real-time.',
            },
          ].map((faq, index) => (
            <details key={index} className="border border-gray-200 rounded-xl group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                {faq.q}
              </summary>
              <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Still have questions?</h3>
          <p className="text-sm text-gray-500">
            Contact our support team via{' '}
            <a href="mailto:support@xecoflow.com" className="text-emerald-600 font-medium">support@xecoflow.com</a>
            {' '}or WhatsApp at <span className="font-medium">+254 700 000000</span>.
          </p>
        </div>
      </div>
    </div>
  );
}