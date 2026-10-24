import type { Metadata } from 'next';
import './globals.css';
import './studio.css';
import { LampProjectProvider } from '@/components/studio/project-context';

export const metadata: Metadata = {
  title: 'AKŌI Form Studio',
  description:
    'Design precise lamps and home decor with parametric shapes, textures, and closed-bottom magnet recesses.',
  other: {
    'codex-preview': 'development',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LampProjectProvider>{children}</LampProjectProvider>
      </body>
    </html>
  );
}
