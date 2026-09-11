import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { ReportForm } from "@/components/report/report-form";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <NavBar
        right={
          <Link href="/account" className="font-medium text-neutral-500 hover:text-neutral-800">
            Sign in
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="mb-6 text-sm text-neutral-600">
          If anyone is in immediate danger, also call your local emergency line. Fill in what you
          can below — most fields are optional, and sending takes a few seconds.
        </p>

        <ReportForm />
      </main>
    </div>
  );
}
