// src/app/(developers)/layout.tsx
import Link from 'next/link';
import Sidebar from './_components/Sidebar';

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-gray-900">Xeco</span>
            <span className="text-emerald-500">Flow</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              Get API Keys
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-100 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto py-8 px-6">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 px-12 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}