import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brain Trigger — Know What Your Content Triggers',
  description: 'Neuroscience-powered marketing analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream text-text-primary antialiased">{children}</body>
    </html>
  );
}
