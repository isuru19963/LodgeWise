import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Properties",
}

export default function PropertiesPage() {
  return (
    <PageShell>
      <Header
        title="Properties"
        description="Hotels, villas, resorts, and every other property type in your portfolio."
      />
      <EmptyState
        title="No properties yet"
        description="When the API is connected, you will create and manage properties, unit types, and units here."
        actionLabel="Add property"
      />
    </PageShell>
  )
}
