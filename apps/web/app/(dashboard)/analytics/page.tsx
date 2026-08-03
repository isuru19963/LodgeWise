import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell, StatCard } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Analytics",
}

export default function AnalyticsPage() {
  return (
    <PageShell>
      <Header
        title="Analytics"
        description="Occupancy, ADR, RevPAR, and channel performance — placeholders until reporting APIs are connected."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ADR" value="—" hint="Average daily rate" />
        <StatCard label="RevPAR" value="—" hint="Revenue per available room" />
        <StatCard label="Occupancy" value="—" hint="Selected period" />
      </div>
      <EmptyState
        title="No analytics yet"
        description="Charts and exports will land here. For now this page confirms the route and layout shell."
      />
    </PageShell>
  )
}
