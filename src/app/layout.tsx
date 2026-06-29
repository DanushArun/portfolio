import type { Metadata, Viewport } from 'next';
import './globals.css';
import { composerMono, dopSerif, directorMonoFull } from '@/lib/fonts';
import { ReducedMotionProvider } from '@/lib/motion/ReducedMotionProvider';

export const metadata: Metadata = {
  title: 'Danush Arun | AI Systems and Product Engineer',
  description:
    'Production AI systems, real-time voice agents, call analytics and AI research.',
  openGraph: {
    title: 'Danush Arun | AI Systems and Product Engineer',
    description:
      'Portfolio of production AI systems at DriveX and research-led engineering work.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08070a',
  width: 'device-width',
  initialScale: 1,
};

const fontVariables = [
  composerMono.variable,
  dopSerif.variable,
  directorMonoFull.variable,
].join(' ');

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <ReducedMotionProvider>
          {children}
        </ReducedMotionProvider>
      </body>
    </html>
  );
}
