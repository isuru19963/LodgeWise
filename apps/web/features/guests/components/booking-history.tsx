"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/features/bookings/components/booking-status-badge"
import {
  formatMoney,
  type Booking,
} from "@/features/bookings/schemas/booking-schema"
import type { Property } from "@/lib/properties"

type BookingHistoryProps = {
  bookings: Booking[]
  properties: Property[]
  isLoading?: boolean
}

export function BookingHistory({
  bookings,
  properties,
  isLoading,
}: BookingHistoryProps) {
  const propertyMap = new Map(properties.map((p) => [p.id, p.name]))

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading stays…</p>
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No booking history yet for this guest.
      </p>
    )
  }

  const sorted = [...bookings].sort((a, b) =>
    b.check_in_date.localeCompare(a.check_in_date)
  )

  return (
    <ul className="space-y-3">
      {sorted.map((booking) => (
        <li
          key={booking.id}
          className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-3 last:border-0"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/bookings"
                className="text-sm font-medium hover:underline"
              >
                {booking.booking_reference}
              </Link>
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.payment_status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {propertyMap.get(booking.property_id) ?? "Property"} ·{" "}
              {booking.check_in_date} → {booking.check_out_date}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(booking.total_amount)} · {booking.adults}A/
              {booking.children}C
            </p>
          </div>
          <Badge variant="outline">
            {booking.items.length} unit
            {booking.items.length === 1 ? "" : "s"}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
