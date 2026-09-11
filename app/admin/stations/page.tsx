import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staffLogout } from "@/app/admin/actions";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StationForm } from "@/components/admin/station-form";

export default async function AdminStationsPage() {
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

  const { data: stations } = await supabase
    .from("fire_stations")
    .select("*")
    .order("name", { ascending: true });

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
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/admin/stations", label: "Fire Stations", active: true },
        ]}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Fire stations</h1>

        <div className="mb-6 space-y-3">
          {(stations ?? []).map((s) => (
            <Card key={s.id}>
              <CardContent>
                <p className="font-semibold text-neutral-900">{s.name}</p>
                <p className="text-sm text-neutral-500">{s.location}</p>
                <p className="text-xs text-neutral-400">
                  {s.latitude}, {s.longitude} {s.contact_phone ? `· ${s.contact_phone}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
          {(!stations || stations.length === 0) && (
            <p className="text-sm text-neutral-500">No fire stations yet — add the first one below.</p>
          )}
        </div>

        <Card>
          <CardContent>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Add a fire station</h2>
            <StationForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
