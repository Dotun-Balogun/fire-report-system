import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staffLogout } from "@/app/admin/actions";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { AnalyticsView } from "@/components/admin/analytics-view";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/admin/login");

  const { data: incidents } = await supabase
    .from("incident_reports")
    .select("severity, status, reported_at, updated_at");

  return (
    <div className="min-h-dvh bg-neutral-50">
      <NavBar
        homeHref="/admin"
        right={
          <form action={staffLogout}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        }
        tabs={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/analytics", label: "Analytics", active: true },
          { href: "/admin/stations", label: "Fire Stations" },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Analytics</h1>
        <AnalyticsView incidents={incidents ?? []} />
      </main>
    </div>
  );
}
