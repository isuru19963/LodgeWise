import type { Metadata } from "next"

import { BookingsPageContent } from "@/features/bookings/components/bookings-page"

export const metadata: Metadata = {
  title: "Bookings",
}

export default function BookingsPage() {
  return <BookingsPageContent />
}
