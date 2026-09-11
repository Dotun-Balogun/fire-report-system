"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeveritySelector, type Severity } from "@/components/report/severity-selector";
import { LocationField, type LocationValue } from "@/components/report/location-field";
import { PhotoCapture } from "@/components/report/photo-capture";
import { submitReport } from "@/app/actions";

export function ReportForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [severity, setSeverity] = useState<Severity | null>(null);
  const [location, setLocation] = useState<LocationValue>({
    latitude: null,
    longitude: null,
    accuracy: null,
    landmark: "",
  });
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!severity) {
      setError("Please tap how serious the fire is.");
      return;
    }
    if (!location.latitude && !location.landmark.trim()) {
      setError("Please add a short description of where the fire is.");
      return;
    }

    startTransition(async () => {
      const result = await submitReport({
        severity,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        landmark: location.landmark,
        description,
        phone,
        photo,
      });

      if (!result.ok || !result.trackingCode) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/track/${result.trackingCode}`);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label>How serious is the fire?</Label>
          <SeveritySelector value={severity} onChange={setSeverity} />
        </div>

        <LocationField value={location} onChange={setLocation} />

        <div>
          <Label htmlFor="description">Anything else responders should know? (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="e.g. Gas cylinders nearby, people trapped inside, road blocked…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="phone">Your phone number (optional, for a callback)</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="e.g. 0803 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <Label>Photo (optional)</Label>
          <PhotoCapture onChange={setPhoto} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
      </div>

      {/* In-flow, not fixed: a fixed bar is what usually breaks on mobile —
          it fights with the iOS/Android on-screen keyboard and browser
          toolbars. A large, unmissable button right after the last field
          is more reliable and just as easy to reach. */}
      <div className="mt-6">
        <Button
          type="submit"
          variant="emergency"
          size="lg"
          className="w-full text-lg"
          disabled={isPending}
        >
          {isPending ? "Sending report…" : "🚨 Send Report"}
        </Button>
      </div>
    </form>
  );
}
