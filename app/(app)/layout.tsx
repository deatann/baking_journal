import AppShell from "@/components/AppShell";
import { getMeCached } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getMeCached();
  // Signed-out visitors get the guest shell (read-only, "Family sign in" in the chibi menu).
  return <AppShell me={session?.me ?? null}>{children}</AppShell>;
}
