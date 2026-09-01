import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { UnitsProvider } from '@/components/UnitsProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
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
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-200 min-h-screen`}>
        <UnitsProvider>{children}</UnitsProvider>
      </body>
    </html>
  );
}
