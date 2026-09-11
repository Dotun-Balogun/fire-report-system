import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staffLogout } from "@/app/admin/actions";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { IncidentBoard } from "@/components/admin/incident-board";

export default async function AdminDashboardPage() {
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
    .select("*, fire_stations(name)")
    .order("reported_at", { ascending: false });

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
          { href: "/admin", label: "Dashboard", active: true },
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/admin/stations", label: "Fire Stations" },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="mb-4 text-sm text-neutral-500">
          Signed in as {profile.full_name} ({profile.role})
        </p>
        <IncidentBoard initialIncidents={incidents ?? []} />
      </main>
    </div>
  );
}
