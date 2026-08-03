"use client"

import Link from "next/link"

import { Header } from "@/components/layout/header"
import { PageShell } from "@/components/shared/page"
import { Button } from "@/components/ui/button"
import { BookingCalendar } from "@/features/bookings/components/booking-calendar"
import { BookingForm } from "@/features/bookings/components/booking-form"

export function CalendarPageContent() {
  return (
    <PageShell>
      <Header
        title="Calendar"
        description="Availability and stay timeline across units. Occupied nights reflect active bookings."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/bookings">View bookings</Link>
        </Button>
        <BookingForm />
      </div>

      <BookingCalendar />
    </PageShell>
  )
}
