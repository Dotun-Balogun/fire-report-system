"use client";

import { Flame, FlameKindling, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/database.types";

export type { Severity };

const OPTIONS: {
  value: Severity;
  label: string;
  hint: string;
  icon: typeof Flame;
  activeClass: string;
}[] = [
  {
    value: "small",
    label: "Small fire",
    hint: "Contained, not spreading yet",
    icon: FlameKindling,
    activeClass: "border-amber-500 bg-amber-50 ring-amber-500",
  },
  {
    value: "spreading",
    label: "Spreading fire",
    hint: "Growing or affecting a building",
    icon: Flame,
    activeClass: "border-orange-500 bg-orange-50 ring-orange-500",
  },
  {
    value: "major",
    label: "Major disaster",
    hint: "Large fire, lives at risk",
    icon: Siren,
    activeClass: "border-red-600 bg-red-50 ring-red-600",
  },
];

interface SeveritySelectorProps {
  value: Severity | null;
  onChange: (value: Severity) => void;
}

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  return (
    <div role="radiogroup" aria-label="How serious is the fire?" className="grid grid-cols-3 gap-2 sm:gap-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-1.5 py-3 text-center transition sm:px-2 sm:py-4",
              "active:scale-[0.97]",
              active ? cn("ring-2", opt.activeClass) : "border-neutral-200 bg-white hover:bg-neutral-50"
            )}
          >
            <Icon
              className={cn("h-6 w-6 sm:h-7 sm:w-7", active ? "text-current" : "text-neutral-500")}
              aria-hidden
            />
            <span className="text-xs font-semibold text-neutral-900 sm:text-sm">{opt.label}</span>
            <span className="hidden text-[11px] leading-tight text-neutral-500 sm:block">{opt.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
