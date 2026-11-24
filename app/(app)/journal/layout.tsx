import type { Metadata } from "next";

// Journal photos and names are more personal than recipes: keep them out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
