import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const session = await getMe(supabase);
  if (!session) redirect("/login");
  return <AppShell me={session.me}>{children}</AppShell>;
}
