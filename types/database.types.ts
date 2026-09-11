// Stable adapter layer. The rest of the app imports from THIS file, never
// from "./supabase-generated.types" directly — that way, running
// `pnpm gen:types` (which overwrites supabase-generated.types.ts) never
// breaks a single import anywhere else in the codebase, as long as the
// enum names in the database don't change.
export type { Database, Json } from "./supabase-generated.types";
import type { Database } from "./supabase-generated.types";

export type Severity = Database["public"]["Enums"]["fire_severity"];
export type IncidentStatus = Database["public"]["Enums"]["incident_status"];
