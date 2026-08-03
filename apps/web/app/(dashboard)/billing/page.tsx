import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell, StatCard } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Billing",
}

export default function BillingPage() {
  return (
    <PageShell>
      <Header
        title="Billing"
        description="Subscription plan, invoices, and limits for this organization."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Current plan" value="—" hint="Not loaded" />
        <StatCard label="Status" value="—" hint="Trial / active / cancelled" />
      </div>
      <EmptyState
        title="Billing not connected"
        description="Plan catalog and subscription endpoints exist on the API. This UI will surface them without payment-gateway wiring yet."
        actionLabel="View plans later"
      />
    </PageShell>
  )
}
