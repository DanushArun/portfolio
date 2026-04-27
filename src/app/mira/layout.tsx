import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mira — Voice AI Agent · Danush Arun',
  description: 'Sub-100ms voice AI for real-time lead conversion. Pipecat · WebSockets · FastAPI.',
};

export default function MiraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
