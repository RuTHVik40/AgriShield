'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/lib/languageContext';
import { ThemeProvider } from '@/lib/themeContext';

export function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
