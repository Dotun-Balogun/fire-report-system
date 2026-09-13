"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStation } from "@/app/admin/stations/actions";

export function StationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createStation(formData);

      if (result.ok) {
        setFeedback({ ok: true, message: "Station added successfully." });
        formRef.current?.reset(); // clear the fields so it's obvious the submission went through
      } else {
        setFeedback({ ok: false, message: result.error ?? "Something went wrong." });
      }

      // Success message clears itself after a few seconds; errors stay
      // until the next attempt so they don't get missed.
      if (result.ok) {
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      {feedback && (
        <div
          className={
            feedback.ok
              ? "flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
              : "flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          }
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {feedback.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Station name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" required />
        </div>
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" type="number" step="any" required />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" name="longitude" type="number" step="any" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="contact_phone">Contact phone (optional)</Label>
          <Input id="contact_phone" name="contact_phone" type="tel" />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add station"}
      </Button>
    </form>
  );
}