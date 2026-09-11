import type { ReactNode } from "react";

export const metadata = {
  title: "Dispatcher Dashboard — Plateau State Fire Service",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-neutral-50">{children}</div>;
}
