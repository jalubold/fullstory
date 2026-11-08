import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fullstory.pro'),
  title: {
    default: 'FULLSTORY — Your photos. Your story. Your book.',
    template: '%s — FULLSTORY',
  },
  description:
    'Create beautiful photo albums from your favourite memories. Choose a professionally designed template, customise every page in your browser, then print, download or share your book.',
  openGraph: {
    type: 'website',
    siteName: 'FULLSTORY',
    title: 'FULLSTORY — Your photos. Your story. Your book.',
    description: 'Turn your favourite memories into beautiful photo albums.',
  },
};

export const viewport: Viewport = {
  themeColor: '#F8F6F1',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/cormorant-garamond-500.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
