import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';

export const metadata: Metadata = {
  title: {
    default: 'Are We Compatible? — Two people. Same questions. Different perspectives.',
    template: '%s · Are We Compatible?',
  },
  description: 'Discover what connects you, where you differ, and what makes your relationship unique. Answer 20 questions separately, then see your results together.',
  openGraph: {
    type: 'website',
    siteName: 'Are We Compatible?',
    title: 'Are We Compatible?',
    description: 'Two people. Same questions. Different perspectives. Discover what connects you, where you differ, and what makes your relationship unique.',
  },
  twitter: { card: 'summary_large_image', title: 'Are We Compatible?', description: 'Two people. Same questions. Different perspectives.' },
};

export const viewport: Viewport = { themeColor: '#FAF7F2' };

export default function CompatLayout({ children }: { children: React.ReactNode }) {
  preload('/fonts/fraunces-400.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  preload('/fonts/manrope-400.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return <div className="awc flex min-h-dvh flex-col antialiased">{children}</div>;
}
