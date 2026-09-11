import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Client-side Supabase instance. Safe to call repeatedly — Next.js will
 * re-run this in every client component that imports it, so we keep it a
 * plain factory function rather than a module-level singleton, matching
 * current Supabase SSR guidance for the App Router.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
