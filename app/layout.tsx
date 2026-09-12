import type { Metadata } from 'next';
import { Work_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { UnitsProvider } from '@/components/UnitsProvider';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

// A soft-serif display face instead of the geometric-sans-plus-gradient-text
// combo — reads more like a travel journal masthead than a SaaS dashboard.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'Empire State Trail 2026 | Pete & Lena\'s Ride',
    template: '%s | Empire State Trail 2026',
  },
  description: 'Follow Pete & Lena\'s 564.5km bike ride from Poughkeepsie to Montreal along the Empire State Trail, Sept 5-11, 2026 (after training up from Brooklyn on Sept 4). Live tracking, daily diary, and photos.',
  keywords: ['Empire State Trail', 'cycling', 'bike touring', 'New York', 'Montreal', 'trail'],
  openGraph: {
    title: 'Empire State Trail 2026 | Pete & Lena\'s Ride',
    description: 'Follow Pete & Lena\'s 564.5km bike ride from Poughkeepsie to Montreal, Sept 5-11, 2026.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empire State Trail 2026 | Pete & Lena\'s Ride',
    description: 'Follow Pete & Lena\'s 564.5km bike ride from Poughkeepsie to Montreal.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${workSans.variable} ${fraunces.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
      </head>
      <body className={`${workSans.className} bg-slate-950 text-slate-200 min-h-screen`}>
        <UnitsProvider>{children}</UnitsProvider>
      </body>
    </html>
  );
}
