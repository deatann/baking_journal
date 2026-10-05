import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getMeCached } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getMeCached();
  if (!session) redirect("/login");
  return <AppShell me={session.me}>{children}</AppShell>;
}
