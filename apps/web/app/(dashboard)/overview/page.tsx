import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell, StatCard } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Overview",
}

export default function OverviewPage() {
  return (
    <PageShell>
      <Header
        title="Overview"
        description="A snapshot of your hospitality operations. Live metrics arrive when the API is connected."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Occupancy" value="—" hint="No data yet" />
        <StatCard label="Arrivals today" value="—" hint="No data yet" />
        <StatCard label="Open bookings" value="—" hint="No data yet" />
        <StatCard label="Revenue (MTD)" value="—" hint="No data yet" />
      </div>
      <EmptyState
        title="Your workspace is ready"
        description="Connect the API to populate occupancy, arrivals, and revenue. Until then, explore the navigation to review each module’s empty state."
        actionLabel="Connect data later"
      />
    </PageShell>
  )
}
