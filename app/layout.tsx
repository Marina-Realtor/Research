import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marina Research | Automated Real Estate Intelligence',
  description: 'Automated research system for Marina Ramirez Real Estate - El Paso, Fort Bliss, and first-time home buyers.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>{children}</body>
    </html>
  );
}
