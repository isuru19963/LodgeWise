import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Calendar",
}

export default function CalendarPage() {
  return (
    <PageShell>
      <Header
        title="Calendar"
        description="Availability and stay timeline across units. Grid views arrive in a later pass."
      />
      <EmptyState
        title="Calendar coming soon"
        description="This foundation page reserves the route. The interactive calendar will use availability and booking data from the API."
        actionLabel="View availability later"
      />
    </PageShell>
  )
}
