import type { Metadata, Viewport } from "next";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/baloo-2/latin-600.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/baloo-2/latin-800.css";
import "@fontsource/caveat/latin-600.css";
import "@fontsource/caveat/latin-700.css";
import "./globals.css";

// Fonts are bundled with the app (no Google Fonts request). The CSS variables that
// tailwind.config.js points at (--font-body, --font-display, --font-hand) are declared
// in globals.css.

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
    <html lang="en">
      <body className="min-h-screen bg-dots font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
