import type { Metadata, Viewport } from 'next';
import './globals.css';
import { composerMono, dopSerif, directorMonoFull } from '@/lib/fonts';
import { ReducedMotionProvider } from '@/lib/motion/ReducedMotionProvider';
import CustomCursor from '@/components/cursor/CustomCursor';

export const metadata: Metadata = {
  title: 'Danush Arun',
  description: 'The Astronaut Who Went Through',
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
          <CustomCursor />
        </ReducedMotionProvider>
      </body>
    </html>
  );
}
