"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStation } from "@/app/admin/stations/actions";

export function StationForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createStation(formData);
      setFeedback(
        result.ok
          ? { ok: true, message: "Station added." }
          : { ok: false, message: result.error ?? "Something went wrong." }
      );
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
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

      {feedback && (
        <p className={feedback.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>
          {feedback.message}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add station"}
      </Button>
    </form>
  );
}
