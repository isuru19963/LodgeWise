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
        description="Start by adding a property, then manage units, bookings, and guests from the sidebar."
        actionLabel="Add property"
        actionHref="/properties/new"
      />
    </PageShell>
  )
}
