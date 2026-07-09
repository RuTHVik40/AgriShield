import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Toaster } from 'react-hot-toast';
import PushInit from '@/components/PushInit';
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} dark`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#047857" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('theme');
                  theme = theme === 'light' ? 'light' : 'dark';
                  var root = document.documentElement;
                  root.dataset.theme = theme;
                  root.classList.toggle('dark', theme === 'dark');
                  root.style.colorScheme = theme;
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) {
                    meta.setAttribute('content', theme === 'light' ? '#2e7d32' : '#047857');
                  }
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>

      <body className="app-body font-body antialiased min-h-screen">
        <Providers>
          <PushInit />
          <div className="relative min-h-screen">
            <div className="theme-backdrop-grid fixed inset-0 pointer-events-none" />
            <div className="theme-backdrop-gradient fixed inset-0 pointer-events-none" />

            <div className="relative z-10">
              {children}
            </div>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg)',
                border: '1px solid var(--toast-border)',
                color: 'var(--toast-text)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#022c22' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1c0a0a' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
