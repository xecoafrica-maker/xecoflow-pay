import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { SessionProvider } from '@/context/SessionContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'XecoFlow',
  description: 'Payment Gateway for Africa',
  other: {
    'Content-Security-Policy': [
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
      "script-src * 'unsafe-inline' 'unsafe-eval';",
      "style-src * 'unsafe-inline';",
      "img-src * data: blob:;",
      "font-src * data:;",
      "connect-src * ws: wss:;"   // ✅ THIS ALLOWS EVERYTHING
    ].join(' ')
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <PreferencesProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a2540]">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Loading XecoFlow...
                    </p>
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}