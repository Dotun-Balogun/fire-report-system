import { NavBar } from "@/components/nav-bar";
import { StatusTracker } from "@/components/status/status-tracker";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="min-h-dvh bg-neutral-50">
      <NavBar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Report status</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Save this page or the code below — you can check back anytime, from any device, to see
          whether action has been taken.
        </p>

        <StatusTracker code={code} />
      </main>
    </div>
  );
}
