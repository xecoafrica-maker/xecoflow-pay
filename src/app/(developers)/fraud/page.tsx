import Link from 'next/link';

export default function FraudPage() {
  return (
    <div className="max-w-4xl">
      <div className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-gray-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Fraud Protection</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">Fraud Protection</h1>
      <p className="text-lg text-gray-500 mb-8">Real-time risk scoring, velocity checks, and configurable fraud rules.</p>
      <h2 className="text-2xl font-bold mt-10 mb-4">Risk Scoring</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200"><th className="text-left py-3 px-4 font-semibold text-gray-600">Score</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Level</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th></tr></thead>
          <tbody>
            {[['0-30','Low','✅ Approved'],['30-70','Medium','⚠️ Flagged'],['70-100','High','❌ Blocked']].map(([r,l,a])=>(<tr key={r} className="border-b border-gray-100"><td className="py-3 px-4 font-medium">{r}</td><td className="py-3 px-4">{l}</td><td className="py-3 px-4 text-gray-500">{a}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}