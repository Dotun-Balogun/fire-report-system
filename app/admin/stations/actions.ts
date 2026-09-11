"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStation(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;

  if (!name || !location || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { ok: false, error: "Please fill in name, location, and valid coordinates." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fire_stations")
    .insert({ name, location, latitude, longitude, contact_phone });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/stations");
  return { ok: true };
}
