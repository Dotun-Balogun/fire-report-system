import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { upgradeAccount, reporterSignIn, reporterSignOut } from "@/app/account/actions";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; created?: string }>;
}) {
  const { mode, error, created } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isRegistered = !!user && !user.is_anonymous;

  if (isRegistered) {
    const { data: reports } = await supabase
      .from("incident_reports")
      .select("id, tracking_code, severity, status, reported_at")
      .order("reported_at", { ascending: false });

    return (
      <div className="min-h-dvh bg-neutral-50">
        <NavBar
          right={
            <form action={reporterSignOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          }
        />
        <main className="mx-auto max-w-lg px-4 py-6">
          <h1 className="mb-1 text-xl font-semibold text-neutral-900">My reports</h1>
          <p className="mb-6 text-sm text-neutral-500">Signed in as {user.email}</p>

          {!reports || reports.length === 0 ? (
            <p className="text-sm text-neutral-500">
              You haven&apos;t submitted any reports yet.{" "}
              <Link href="/" className="font-medium text-red-600 underline">
                Report a fire
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Link key={r.id} href={`/track/${r.tracking_code}`}>
                  <Card className="transition hover:border-neutral-300">
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold text-neutral-900">
                          {r.tracking_code}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(r.reported_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const isSignIn = mode === "signin";

  return (
    <div className="min-h-dvh bg-neutral-50">
      <NavBar />
      <main className="mx-auto max-w-sm px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">
          {isSignIn ? "Sign in" : "Save your reports"}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {isSignIn
            ? "Sign in to see reports you've filed from other visits."
            : "Optional — create an account to see all your past reports from any device. You never need this to report a fire."}
        </p>

        {created && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Account created. If email confirmation is enabled for this project, check your inbox to
            confirm before signing in elsewhere.
          </p>
        )}
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <form action={isSignIn ? reporterSignIn : upgradeAccount} className="space-y-4">
          {!isSignIn && (
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required autoComplete="name" />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignIn ? "current-password" : "new-password"}
            />
          </div>
          <SubmitButton pendingText={isSignIn ? "Signing in…" : "Creating account…"} className="w-full">
            {isSignIn ? "Sign in" : "Create account"}
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          {isSignIn ? (
            <>
              New here?{" "}
              <Link href="/account" className="font-medium text-neutral-900 underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/account?mode=signin" className="font-medium text-neutral-900 underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </main>
    </div>
  );
}