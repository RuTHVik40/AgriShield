import { Inter } from 'next/font/google';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Toaster } from 'react-hot-toast';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'AgriShield — AI-Powered Precision Agriculture',
  description: 'Detect crop diseases, receive proximity alerts, and join the farming intelligence network.',
  manifest: '/manifest.json',
  themeColor: '#047857',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: 'AgriShield',
    description: 'AI Precision Agriculture Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body bg-dark-900 text-white antialiased min-h-screen">
        <Providers>
          <div className="relative min-h-screen">
            {/* Background texture */}
            <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950/30 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(6,18,9,0.95)',
                border: '1px solid rgba(4,120,87,0.3)',
                color: '#d1fae5',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#022c22' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#1c0a0a' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
