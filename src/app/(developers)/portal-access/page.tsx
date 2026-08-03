// src/app/(developers)/portal-access/page.tsx
import Link from 'next/link';

export default function PortalAccessPage() {
  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/introduction" className="hover:text-gray-600">Developers</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Merchant Portal Access</span>
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">
        Merchant Portal Access
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-gray-500 leading-relaxed mb-8">
          The XecoFlow Merchant Portal is your command center for managing payments, tracking
          transactions, creating payment pages, and configuring your account. This guide walks
          you through every section of the portal.
        </p>

        {/* Logging In */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Logging In
        </h2>
        <p className="text-gray-600 mb-4">
          Access the merchant portal by navigating to <Link href="/login" className="text-emerald-600 font-medium">xecoflow.com/login</Link>.
          You can sign in using your registered phone number or email address.
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 mb-6">
          <li>Enter your phone number or email</li>
          <li>Enter the 6-digit OTP sent to your phone</li>
          <li>You're redirected to the dashboard</li>
        </ol>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 mb-6">
          <strong>Security Tip:</strong> Enable two-factor authentication (2FA) in Settings for
          an extra layer of account protection.
        </div>

        {/* Dashboard Overview */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Dashboard Overview
        </h2>
        <p className="text-gray-600 mb-4">
          The dashboard provides a snapshot of your payment activity:
        </p>
        <div className="space-y-3 mb-6">
          {[
            { label: 'Total Received', desc: 'Sum of all successful payments' },
            { label: 'Pending', desc: 'Payments awaiting confirmation' },
            { label: 'Payment Pages', desc: 'Active payment links you\'ve created' },
            { label: 'Transactions', desc: 'Total number of payment attempts' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-4">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">{stat.label}</span>
                <span className="text-sm text-gray-500 ml-2">— {stat.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Pages */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Payment Pages
        </h2>
        <p className="text-gray-600 mb-4">
          Payment pages are the simplest way to start accepting payments. Each page generates a
          unique link you can share with customers.
        </p>
        <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="text-xs text-gray-400 font-medium">Creating a Payment Page</span>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
            <code>{`1. Go to Payment Pages → Create New
2. Fill in the details:
   - Page Title: "Website Design Service"
   - Amount (KES): 15000
   - Description (optional)
   - Custom slug: "web-design"
3. Click "Create Payment Page"
4. Copy the link: pay.xecoflow.com/pay/web-design
5. Share with customers via WhatsApp, Email, or QR Code`}</code>
          </pre>
        </div>

        {/* Transactions */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Transactions
        </h2>
        <p className="text-gray-600 mb-4">
          The Transactions page shows every payment attempt — successful, pending, and failed.
          You can filter by status, search by phone number, and export data.
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Column</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Transaction ID', 'Unique identifier for the transaction'],
                ['Page', 'Which payment page was used'],
                ['Amount', 'Amount in KES'],
                ['Fee', 'XecoFlow processing fee'],
                ['Net', 'Amount after fee deduction'],
                ['Customer', 'Customer phone number'],
                ['Method', 'Payment method used'],
                ['Status', 'Completed, Pending, or Failed'],
                ['Date', 'Date and time of transaction'],
              ].map(([col, desc]) => (
                <tr key={col} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{col}</td>
                  <td className="py-3 px-4 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Withdrawals */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Withdrawals
        </h2>
        <p className="text-gray-600 mb-4">
          For Path A (instant onboarding), your balance accumulates in your XecoFlow wallet.
          You can withdraw to your M-PESA or bank account at any time.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 mb-6">
          <strong>Withdrawal Process:</strong><br />
          1. Go to <strong>Withdraw</strong> in the sidebar<br />
          2. Enter the amount to withdraw<br />
          3. Confirm with OTP<br />
          4. Funds arrive in your M-PESA within minutes (bank: 2-3 business days)
        </div>

        {/* Settings */}
        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Settings
        </h2>
        <p className="text-gray-600 mb-4">
          Manage your account configuration:
        </p>
        <div className="space-y-3 mb-6">
          {[
            'Profile — Update business name, email, and contact details',
            'Payment Setup — Link your own Till/PayBill (Path B) or manage instant onboarding',
            'API Keys — Generate and manage API keys for integration',
            'Webhooks — Configure webhook endpoints for real-time notifications',
            'Team — Add team members with role-based access',
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

        {/* Next Steps */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>
              <Link href="/payment-methods" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Payment Methods & Currencies →
              </Link>
              {' '}Explore all supported payment methods and currencies.
            </li>
            <li>
              <Link href="/quickstart" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Quick Start Guide →
              </Link>
              {' '}Return to the integration guide.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}