"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { IncidentStatus } from "@/types/database.types";

export async function staffLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent("Incorrect email or password.")}`);
  }

  redirect("/admin");
}

export async function staffLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("incident_reports")
    .update({ status })
    .eq("id", incidentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
