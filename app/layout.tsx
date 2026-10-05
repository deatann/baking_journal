import type { Metadata, Viewport } from "next";
import { Baloo_2, Caveat, Nunito } from "next/font/google";
import "./globals.css";

// Rounded, friendly display font for headings...
const displayFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

// ...a handwritten accent for taglines and small personal touches...
const handFont = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-hand",
});

// ...and a clean rounded sans for body text.
const bodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Baking Journal",
  description: "Our family recipes, scaling calculator, and baking log.",
  applicationName: "Baking Journal",
  icons: {
    icon: "/icons/favicon-64.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Baking Journal", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${handFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-dots font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
