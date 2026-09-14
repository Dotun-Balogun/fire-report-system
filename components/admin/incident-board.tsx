"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Check, Download, ImageIcon, Loader2, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateIncidentStatus } from "@/app/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IncidentStatus, Severity } from "@/types/database.types";

interface IncidentRow {
  id: string;
  tracking_code: string;
  description: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  severity: Severity;
  phone: string | null;
  photo_path: string | null;
  status: IncidentStatus;
  reported_at: string;
  fire_stations: { name: string } | null;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  small: "Small fire",
  spreading: "Spreading fire",
  major: "Major disaster",
};

const STATUS_OPTIONS: IncidentStatus[] = ["received", "verified", "dispatched", "resolved"];
const ORIGINAL_TITLE = "Dispatcher Dashboard — Plateau State Fire Service";

type SaveState = "saving" | "saved" | "error" | undefined;

// Generates a short two-tone alert beep with no external audio file —
// works the instant the page loads, nothing to fetch or fail to load.
function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.16);
    });
  } catch {
    // Some browsers block audio until the user has interacted with the
    // page at least once — the visual toast and tab-title flash below
    // still work regardless, so a new report is never silent AND invisible.
  }
}

export function IncidentBoard({ initialIncidents }: { initialIncidents: IncidentRow[] }) {
  const [incidents, setIncidents] = useState<IncidentRow[]>(initialIncidents);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTitleFlash() {
    if (titleFlashRef.current) return;
    let on = false;
    titleFlashRef.current = setInterval(() => {
      document.title = on ? ORIGINAL_TITLE : "🔴 New Fire Report!";
      on = !on;
    }, 1000);
  }
  function stopTitleFlash() {
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current);
      titleFlashRef.current = null;
    }
    document.title = ORIGINAL_TITLE;
  }

  useEffect(() => {
    // Stop the flashing tab title as soon as the dispatcher actually
    // looks at the tab again.
    function onFocus() {
      stopTitleFlash();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      stopTitleFlash();
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Live channel: a new report from anywhere in the State appears on
    // every open dashboard instantly, without a page refresh — and now
    // also triggers a sound, an on-screen banner, and a flashing browser
    // tab title, so it is never just a silent list update a dispatcher
    // could easily miss.
    const channel = supabase
      .channel("incident_reports_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_reports" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as IncidentRow;
            setIncidents((prev) => [incoming, ...prev]);

            playAlertSound();
            setToast(`🚨 New report received — ${incoming.tracking_code}`);
            setTimeout(() => setToast(null), 6000);

            setNewIds((prev) => new Set(prev).add(incoming.id));
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(incoming.id);
                return next;
              });
            }, 10000);

            if (document.hidden) startTitleFlash();
          } else if (payload.eventType === "UPDATE") {
            setIncidents((prev) =>
              prev.map((row) =>
                row.id === (payload.new as IncidentRow).id
                  ? { ...row, ...(payload.new as IncidentRow) }
                  : row
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleStatusChange(id: string, status: IncidentStatus) {
    setIncidents((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    setSaveState((prev) => ({ ...prev, [id]: "saving" }));

    const result = await updateIncidentStatus(id, status);

    setSaveState((prev) => ({ ...prev, [id]: result.ok ? "saved" : "error" }));
    setTimeout(() => {
      setSaveState((prev) => ({ ...prev, [id]: undefined }));
    }, 2000);
  }

  async function viewPhoto(path: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("incident-photos").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function exportCsv() {
    const headers = ["tracking_code", "severity", "status", "landmark", "phone", "station", "reported_at"];
    const rows = incidents.map((i) => [
      i.tracking_code,
      i.severity,
      i.status,
      (i.landmark ?? "").replace(/,/g, ";"),
      i.phone ?? "",
      i.fire_stations?.name ?? "",
      i.reported_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <BellRing className="h-4 w-4 shrink-0 animate-pulse" aria-hidden />
          {toast}
        </div>
      )}

      {incidents.length === 0 ? (
        <p className="text-sm text-neutral-500">No reports yet.</p>
      ) : (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      )}

      {incidents.map((incident) => {
        const state = saveState[incident.id];
        const isNew = newIds.has(incident.id);
        return (
          <Card
            key={incident.id}
            className={cn(isNew && "ring-2 ring-red-500 border-red-300")}
          >
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {isNew && <Badge variant="major">NEW</Badge>}
                  <span className="font-mono text-sm font-semibold text-neutral-900">
                    {incident.tracking_code}
                  </span>
                  <Badge variant={incident.severity}>{SEVERITY_LABEL[incident.severity]}</Badge>
                  <Badge variant={incident.status}>{incident.status}</Badge>
                </div>

                <p className="text-sm text-neutral-700">
                  {incident.landmark || "No landmark provided"}
                </p>
                {incident.description && (
                  <p className="mt-1 text-sm text-neutral-500">{incident.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span>{new Date(incident.reported_at).toLocaleString()}</span>
                  {incident.fire_stations?.name && <span>→ {incident.fire_stations.name}</span>}
                  {incident.phone && (
                    <a href={`tel:${incident.phone}`}
                      className="inline-flex items-center gap-1 text-neutral-700 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {incident.phone}
                    </a>
                  )}
                  {incident.photo_path && (
                    <button
                      type="button"
                      onClick={() => viewPhoto(incident.photo_path!)}
                      className="inline-flex items-center gap-1 text-neutral-700 hover:underline"
                    >
                      <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                      View photo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={incident.status}
                  onChange={(e) => handleStatusChange(incident.id, e.target.value as IncidentStatus)}
                  className="h-10 w-full shrink-0 rounded-lg border border-neutral-300 bg-white px-3 text-sm sm:w-auto"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    state === "saved" && "text-green-600",
                    state === "error" && "text-red-600",
                    state === "saving" && "text-neutral-400"
                  )}
                >
                  {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {state === "saved" && <Check className="h-3.5 w-3.5" aria-hidden />}
                  {state === "saving" && "Saving…"}
                  {state === "saved" && "Saved"}
                  {state === "error" && "Failed — try again"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}