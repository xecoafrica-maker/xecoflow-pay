// src/app/(developers)/merchant-account/page.tsx
import Link from 'next/link';

export default function MerchantAccountPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Get a Merchant Account</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Get a Merchant Account
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          A merchant account allows you to process real payments and receive settlements.
          Follow these steps to upgrade from the sandbox to a live production account.
        </p>

        {/* Account Types */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Account Types
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 mb-2">Sandbox Account</h3>
            <p className="text-sm text-gray-500">Test environment with simulated payments. No KYC required. Start building immediately.</p>
          </div>
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 mb-2">Production Account</h3>
            <p className="text-sm text-gray-500">Live environment with real money movement. Requires business verification and KYC.</p>
          </div>
        </div>

        {/* Requirements */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Requirements for Production
        </h2>
        <div className="space-y-3 mb-6">
          {[
            'Business registration certificate (or sole proprietorship)',
            'KRA PIN certificate',
            'Director/owner national ID or passport',
            'Active M-PESA Till or PayBill number',
            'Company bank account for settlements',
            'Physical business address',
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

        {/* M-PESA Setup */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          M-PESA Till / PayBill Setup
        </h2>
        <p className="text-gray-600 mb-4">
          You need an active M-PESA merchant number to receive payments. If you don't have one:
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 mb-6">
          <li>Visit any Safaricom Shop with your business documents</li>
          <li>Request a <strong>Buy Goods Till</strong> or <strong>PayBill</strong> number</li>
          <li>Once activated, link it to your XecoFlow dashboard</li>
          <li>Alternatively, email <a href="mailto:apiuser@safaricom.co.ke" className="text-emerald-600 font-medium">apiuser@safaricom.co.ke</a></li>
        </ol>

        {/* Daraja API Setup */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Safaricom Daraja API Setup
        </h2>
        <p className="text-gray-600 mb-4">
          For direct integration (Path B), you need Daraja API credentials. Here's how to get them:
        </p>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Daraja Portal Setup Steps</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`1. Go to https://developer.safaricom.co.ke
2. Create an account or sign in
3. Click "My Apps" → "Create App"
4. Select "C2B" and "STK Push" APIs
5. Fill in your PayBill/Till details
6. Submit for Go-Live approval
7. Once approved, copy Consumer Key & Secret`}</code>
          </pre>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
          ⚠️ <strong>Note:</strong> The Daraja Go-Live process can take 1-4 weeks. In the meantime,
          you can start accepting payments immediately using XecoFlow's Path A (instant onboarding)
          — we use our PayBill and forward the money to your M-PESA instantly. <Link href="/introduction" className="font-medium underline">Learn more</Link>.
        </div>

        {/* Dashboard Activation */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Activating in Dashboard
        </h2>
        <p className="text-gray-600 mb-4">
          Once you have your credentials, activate your production account:
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 mb-6">
          <li>Log in to your XecoFlow Dashboard</li>
          <li>Go to <strong>Settings → Payment Setup</strong></li>
          <li>Enter your Till/PayBill number and Daraja credentials</li>
          <li>Click <strong>Verify & Activate</strong></li>
          <li>XecoFlow will test the credentials and activate your account</li>
        </ol>

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/portal-access" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Merchant Portal Access →
              </Link>
              {' '}Learn how to navigate the XecoFlow merchant dashboard.
            </li>
            <li>
              <Link href="/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods & Currencies →
              </Link>
              {' '}See all supported payment methods and currencies.
            </li>
            <li>
              <Link href="/sandbox" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Back to Sandbox →
              </Link>
              {' '}Return to testing your integration.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}