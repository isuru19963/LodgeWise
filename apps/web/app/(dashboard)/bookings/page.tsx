import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Bookings",
}

export default function BookingsPage() {
  return (
    <PageShell>
      <Header
        title="Bookings"
        description="Reservations across your properties — create, modify, and track stay status."
      />
      <EmptyState
        title="No bookings yet"
        description="Booking lists and details will appear here once the API is connected. Availability checks stay on the server."
        actionLabel="Create booking"
      />
    </PageShell>
  )
}
