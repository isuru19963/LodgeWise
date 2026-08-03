import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Lodgwise AI",
  description:
    "AI-powered Property Management System for modern hospitality businesses.",
}

export default function LandingPage() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Early development
        </span>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Lodgwise AI
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          AI-powered Property Management System for modern hospitality
          businesses.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/overview">Open dashboard</Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        Hotels · Villas · Resorts · Cabanas · Hostels · Guest Houses · Apartments
      </footer>
    </main>
  )
}
