"use client";

import { useEffect, useState } from "react";
import { LocateFixed, MapPin, TriangleAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  landmark: string;
}

interface LocationFieldProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

type GpsState = "locating" | "found" | "denied" | "unsupported";

export function LocationField({ value, onChange }: LocationFieldProps) {
  const [gpsState, setGpsState] = useState<GpsState>("locating");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsState("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsState("found");
        onChange({
          ...value,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => setGpsState("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    // Runs once on mount — this is a "grab it immediately" affordance, not
    // something the reporter should have to trigger themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Label htmlFor="landmark">Where is the fire?</Label>

      <div
        className={cn(
          "mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          gpsState === "found" && "bg-green-50 text-green-700",
          gpsState === "locating" && "bg-neutral-100 text-neutral-600",
          (gpsState === "denied" || gpsState === "unsupported") && "bg-amber-50 text-amber-700"
        )}
      >
        {gpsState === "locating" && (
          <>
            <LocateFixed className="h-4 w-4 animate-pulse" aria-hidden />
            Finding your location…
          </>
        )}
        {gpsState === "found" && (
          <>
            <MapPin className="h-4 w-4" aria-hidden />
            Location detected
            {value.accuracy ? ` (accurate to ~${Math.round(value.accuracy)}m)` : ""}
          </>
        )}
        {(gpsState === "denied" || gpsState === "unsupported") && (
          <>
            <TriangleAlert className="h-4 w-4" aria-hidden />
            Couldn&apos;t get your location automatically — please describe it below.
          </>
        )}
      </div>

      <Textarea
        id="landmark"
        rows={2}
        required={gpsState !== "found"}
        placeholder="e.g. Behind Rayfield Market, along old Bukuru Road"
        value={value.landmark}
        onChange={(e) => onChange({ ...value, landmark: e.target.value })}
      />
      <p className="mt-1 text-xs text-neutral-500">
        A short landmark description helps responders even when GPS is accurate.
      </p>
    </div>
  );
}
