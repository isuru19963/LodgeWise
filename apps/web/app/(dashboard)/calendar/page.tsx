import type { Metadata } from "next"

import { CalendarPageContent } from "@/features/bookings/components/calendar-page"

export const metadata: Metadata = {
  title: "Calendar",
}

export default function CalendarPage() {
  return <CalendarPageContent />
}
