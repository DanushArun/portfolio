import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typography — three families, self-hosted at build time by next/font.
 *
 *   Syne 800            → display-only headings (hero, section titles)
 *   Space Grotesk 300-700 → body + UI sans
 *   Space Mono 400/700  → labels, coordinates, telemetry
 *
 * Each family is exposed as a CSS custom property so globals.css can
 * compose them with string fallbacks. This avoids FOUT inside GSAP
 * timelines that query computed styles during animation setup.
 */
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Danush Arun",
  description: "Software Engineer · Agentic AI · Electromagnetic Physics",
};

export const viewport: Viewport = {
  themeColor: "#0B0D10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div
          className={`${syne.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
