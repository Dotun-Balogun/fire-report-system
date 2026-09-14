"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The destination for the "Track a Report" link, and for anyone who was
 * handed a tracking code by someone else (e.g. texted the code a family
 * member copied from their confirmation screen). This is the page that
 * answers "where do I paste the code" — typing/pasting it here and
 * submitting takes you straight to /track/[code].
 */
export default function TrackLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a tracking code.");
      return;
    }
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      <NavBar />
      <main className="mx-auto max-w-sm px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Track a report</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Paste or type the tracking code you received after reporting — for example{" "}
          <span className="font-mono">FR-7K2M9Q</span> — to see its current status.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Tracking code</Label>
            <Input
              id="code"
              name="code"
              placeholder="FR-XXXXXX"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono uppercase"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" aria-hidden />
            Check status
          </Button>
        </form>
      </main>
    </div>
  );
}