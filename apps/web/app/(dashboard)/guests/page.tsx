import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Guests",
}

export default function GuestsPage() {
  return (
    <PageShell>
      <Header
        title="Guests"
        description="Guest profiles shared across every property in your organization."
      />
      <EmptyState
        title="No guests yet"
        description="Search and manage guest profiles here after the CRM endpoints are wired to the UI."
        actionLabel="Add guest"
      />
    </PageShell>
  )
}
