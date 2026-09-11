"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function upgradeAccount(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || password.length < 6) {
    redirect(`/account?error=${encodeURIComponent("Please enter a valid email and a password of at least 6 characters.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If we already have an anonymous session (the normal case — everyone
  // gets one the moment they open the site), we UPGRADE it in place, so
  // every report already filed under this session id stays attached to
  // the account. If for some reason there's no session yet, fall back to
  // a normal sign-up.
  const { error } =
    user && user.is_anonymous
      ? await supabase.auth.updateUser({ email, password, data: { full_name: fullName } })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?created=1");
}

export async function reporterSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/account?mode=signin&error=${encodeURIComponent("Incorrect email or password.")}`);
  }

  redirect("/account");
}

export async function reporterSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
