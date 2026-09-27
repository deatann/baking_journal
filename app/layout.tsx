import type { Metadata } from "next";
import { Baloo_2, Caveat } from "next/font/google";
import "./globals.css";

// A rounded, friendly display font for headings (playful, not corporate)...
const displayFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

// ...and a handwritten accent font for small personal touches (taglines,
// dates, star-rating captions) - used sparingly, never for body text.
const handFont = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: "Baking Journal",
  description: "My modified recipes, scaling calculator, and baking log.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${handFont.variable}`}>
      <body className="min-h-screen bg-dots text-crust-900 antialiased">{children}</body>
    </html>
  );
}
