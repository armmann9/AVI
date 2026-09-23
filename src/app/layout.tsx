import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/authContext';

export const metadata: Metadata = {
  title: 'BPSCVS — Bani Park Sindhi Colony Vikas Samiti',
  description:
    'Community portal, events directory, AI face photo search, and administration for Bani Park Sindhi Colony Vikas Samiti.',
  keywords: ['BPSCVS', 'Bani Park Sindhi Colony', 'Vikas Samiti', 'Jaipur', 'community events', 'photo gallery'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#FAF8F5', color: '#0F172A' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Rozha+One&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ minHeight: '100vh', margin: 0, backgroundColor: '#FAF8F5', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
