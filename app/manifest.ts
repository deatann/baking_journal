import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home Screen") with the chibi as the app icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baking Journal",
    short_name: "Bakes",
    description: "Our family recipes and baking log.",
    start_url: "/recipes",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf8f3",
    theme_color: "#fdf8f3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
