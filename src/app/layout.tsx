import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react'; // ✅ ADD THIS

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'XecoFlow',
  description: 'Payment Gateway for Africa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ✅ WRAP CHILDREN IN SUSPENSE */}
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Loading XecoFlow...</p>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </body>
    </html>
  );
}