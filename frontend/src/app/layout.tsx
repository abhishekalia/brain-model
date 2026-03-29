import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brain Trigger — See How Your Content Activates the Brain',
  description: 'AI-powered neuroscience analysis of marketing content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
