import Link from 'next/link';

export default function RecurringPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-gray-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Recurring & Bulk Payments</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">Recurring & Bulk Payments</h1>
      <p className="text-lg text-gray-500 mb-8">Automate subscription billing and process bulk payments to multiple recipients.</p>
      <h2 className="text-2xl font-bold mt-10 mb-4">Create a Subscription Plan</h2>
      <div className="bg-[#0b1220] rounded-xl border border-white/10 shadow-xl mb-6 overflow-hidden">
        <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
          <code>{`const plan = await xecoflow.subscriptions.createPlan({
  name: 'Premium Monthly',
  amount: 2999,
  currency: 'KES',
  interval: 'month'
});`}</code>
        </pre>
      </div>
    </div>
  );
}