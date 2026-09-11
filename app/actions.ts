"use server";

import { createClient } from "@/lib/supabase/server";
import { generateTrackingCode } from "@/lib/utils";
import type { Severity } from "@/types/database.types";

export interface SubmitReportInput {
  severity: Severity;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  landmark: string;
  description: string;
  phone: string;
  photo: File | null;
}

export interface SubmitReportResult {
  ok: boolean;
  trackingCode?: string;
  error?: string;
}

export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const supabase = await createClient();

  // Every reporter gets a session, even if they never sign up — this is
  // what lets us apply Row-Level Security (so nobody else can read their
  // report) without ever showing them a login screen under duress.
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return { ok: false, error: "Could not start a secure session. Please try again." };
    }
    user = data.user;
  }

  if (!input.severity) {
    return { ok: false, error: "Please choose how serious the fire is." };
  }
  if (!input.latitude && !input.landmark.trim()) {
    return { ok: false, error: "Please add a location or a short description of where the fire is." };
  }

  let photoPath: string | null = null;
  if (input.photo) {
    const ext = input.photo.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("incident-photos")
      .upload(path, input.photo, { contentType: input.photo.type });

    if (uploadError) {
      // Never block a fire report on a photo upload failing — the report
      // itself matters far more than the picture.
      photoPath = null;
    } else {
      photoPath = path;
    }
  }

  const trackingCode = generateTrackingCode();

  const { error: insertError } = await supabase.from("incident_reports").insert({
    tracking_code: trackingCode,
    reporter_id: user.id,
    severity: input.severity,
    latitude: input.latitude,
    longitude: input.longitude,
    location_accuracy_m: input.accuracy,
    landmark: input.landmark.trim() || null,
    description: input.description.trim() || null,
    phone: input.phone.trim() || null,
    photo_path: photoPath,
  });

  if (insertError) {
    return { ok: false, error: "Something went wrong sending your report. Please try again." };
  }

  return { ok: true, trackingCode };
}
