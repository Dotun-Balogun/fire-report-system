import Link from "next/link";
import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavBarProps {
  /** Where the logo/name links to. Defaults to the public homepage; admin pages pass "/admin". */
  homeHref?: string;
  /** Right-hand side content — e.g. "Staff login" on the public site, or "Log out" on the admin side. */
  right?: ReactNode;
  /** Optional secondary links shown under the logo row (used by the admin section). */
  tabs?: { href: string; label: string; active?: boolean }[];
  /** Hide the built-in "Admin" login link — pass false from pages already inside the admin area. */
  showAdminLink?: boolean;
  className?: string;
}

export function NavBar({ homeHref = "/", right, tabs, showAdminLink = true, className }: NavBarProps) {
  return (
    <header className={cn("sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href={homeHref} className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
            <Flame className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-neutral-900">
              Plateau State Fire Service
            </p>
            <p className="hidden truncate text-xs leading-tight text-neutral-500 sm:block">
              Fire Disaster Report Management System
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 text-sm">
          {right}
          {showAdminLink && (
            <Link
              href="/admin/login"
              className="shrink-0 whitespace-nowrap rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
                tab.active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}