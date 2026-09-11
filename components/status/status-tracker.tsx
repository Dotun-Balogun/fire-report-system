"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, CircleDot, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { IncidentStatus, Severity } from "@/types/database.types";

interface StatusRow {
  status: IncidentStatus;
  severity: Severity;
  station_name: string | null;
  reported_at: string;
  updated_at: string;
}

const STEPS: { key: IncidentStatus; label: string }[] = [
  { key: "received", label: "Report received" },
  { key: "verified", label: "Verified by dispatcher" },
  { key: "dispatched", label: "Responders dispatched" },
  { key: "resolved", label: "Resolved" },
];

export function StatusTracker({ code }: { code: string }) {
  const [row, setRow] = useState<StatusRow | null | "not_found">(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase.rpc("get_incident_status", { p_tracking_code: code });
      if (cancelled) return;
      const first = data?.[0];
      setRow(first ?? "not_found");
    }

    load();
    const interval = setInterval(load, 5000); // feels live without needing a realtime channel for anonymous cross-device access
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code]);

  if (row === null) {
    return <p className="text-sm text-neutral-500">Loading status…</p>;
  }

  if (row === "not_found") {
    return (
      <p className="text-sm text-neutral-600">
        We couldn&apos;t find a report with the code <strong>{code}</strong>. Double-check the
        code, or submit a new report if this is an emergency.
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === row.status);
  const actionTaken = row.status !== "received";

  return (
    <div>
      <div
        className={cn(
          "mb-4 rounded-2xl px-4 py-3 text-sm font-semibold",
          actionTaken ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
        )}
      >
        {actionTaken
          ? "✅ Action has been taken on this report."
          : "⏳ Awaiting action — your report has been received."}
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Flame className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Tracking code</p>
          <p className="font-mono text-lg font-semibold text-neutral-900">{code}</p>
        </div>
      </div>

      <ol className="space-y-4">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" aria-hidden />
              ) : active ? (
                <CircleDot className="h-6 w-6 shrink-0 animate-pulse text-red-600" aria-hidden />
              ) : (
                <Circle className="h-6 w-6 shrink-0 text-neutral-300" aria-hidden />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-neutral-900" : done ? "text-neutral-600" : "text-neutral-400"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {row.station_name && (
        <p className="mt-6 text-sm text-neutral-600">
          Assigned station: <strong>{row.station_name}</strong>
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-400">
        Last updated {new Date(row.updated_at).toLocaleTimeString()}
      </p>
    </div>
  );
}
