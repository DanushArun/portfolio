import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typography — Three Voices
 *
 *   Director (Display) : Cormorant Garamond (fallback for PP Editorial New)
 *   DOP (Body)         : Instrument Serif (All body is italic)
 *   Composer (System)  : JetBrains Mono (HUD, labels, telemetry)
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-director",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-dop",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-composer",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Danush Arun",
  description: "The Astronaut Who Went Through",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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
          className={`${cormorant.variable} ${instrument.variable} ${jetbrains.variable}`}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
