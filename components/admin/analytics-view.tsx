import { cn } from "@/lib/utils";

interface IncidentForStats {
  severity: "small" | "spreading" | "major";
  status: "received" | "verified" | "dispatched" | "resolved";
  reported_at: string;
  updated_at: string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, total, colorClass }: { label: string; count: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="text-neutral-500">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className={cn("h-full rounded-full", colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsView({ incidents }: { incidents: IncidentForStats[] }) {
  const total = incidents.length;

  const bySeverity = {
    small: incidents.filter((i) => i.severity === "small").length,
    spreading: incidents.filter((i) => i.severity === "spreading").length,
    major: incidents.filter((i) => i.severity === "major").length,
  };

  const byStatus = {
    received: incidents.filter((i) => i.status === "received").length,
    verified: incidents.filter((i) => i.status === "verified").length,
    dispatched: incidents.filter((i) => i.status === "dispatched").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  const resolved = incidents.filter((i) => i.status === "resolved");
  const avgResolutionMinutes =
    resolved.length > 0
      ? Math.round(
          resolved.reduce(
            (sum, i) => sum + (new Date(i.updated_at).getTime() - new Date(i.reported_at).getTime()),
            0
          ) /
            resolved.length /
            60000
        )
      : null;

  // Reports per day for the last 7 days
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayKey = date.toDateString();
    const count = incidents.filter((inc) => new Date(inc.reported_at).toDateString() === dayKey).length;
    days.push({ label: date.toLocaleDateString(undefined, { weekday: "short" }), count });
  }
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total reports" value={total} />
        <StatCard label="Awaiting action" value={byStatus.received} sub="status: received" />
        <StatCard label="Resolved" value={byStatus.resolved} />
        <StatCard
          label="Avg. time to resolve"
          value={avgResolutionMinutes !== null ? `${avgResolutionMinutes}m` : "—"}
          sub={resolved.length > 0 ? `from ${resolved.length} resolved reports` : "no resolved reports yet"}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Reports, last 7 days</h3>
        <div className="flex h-28 items-end gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-red-500"
                style={{ height: `${Math.max(4, (d.count / maxDayCount) * 100)}%` }}
                title={`${d.count} reports`}
              />
              <span className="text-[10px] text-neutral-500">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">By severity</h3>
          <BarRow label="Small fire" count={bySeverity.small} total={total} colorClass="bg-amber-500" />
          <BarRow label="Spreading fire" count={bySeverity.spreading} total={total} colorClass="bg-orange-500" />
          <BarRow label="Major disaster" count={bySeverity.major} total={total} colorClass="bg-red-600" />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">By status</h3>
          <BarRow label="Received" count={byStatus.received} total={total} colorClass="bg-blue-500" />
          <BarRow label="Verified" count={byStatus.verified} total={total} colorClass="bg-amber-500" />
          <BarRow label="Dispatched" count={byStatus.dispatched} total={total} colorClass="bg-orange-500" />
          <BarRow label="Resolved" count={byStatus.resolved} total={total} colorClass="bg-green-600" />
        </div>
      </div>
    </div>
  );
}
