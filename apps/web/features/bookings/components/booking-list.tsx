"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookingCard } from "@/features/bookings/components/booking-card"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/features/bookings/components/booking-status-badge"
import type { Booking, Guest } from "@/features/bookings/schemas/booking-schema"
import { guestDisplayName } from "@/features/bookings/schemas/booking-schema"
import type { Property } from "@/lib/properties"
import type { Unit } from "@/features/units/schemas/unit-schema"

type BookingListProps = {
  bookings: Booking[]
  guests: Guest[]
  properties: Property[]
  unitsByProperty: Map<string, Unit[]>
  isLoading?: boolean
}

function resolveUnitLabel(
  booking: Booking,
  unitsByProperty: Map<string, Unit[]>
): string {
  const units = unitsByProperty.get(booking.property_id) ?? []
  const names = booking.items.map((item) => {
    const unit = units.find((u) => u.id === item.unit_id)
    return unit ? `${unit.name} (${unit.code})` : item.unit_id.slice(0, 8)
  })
  return names.join(", ") || "—"
}

export function BookingList({
  bookings,
  guests,
  properties,
  unitsByProperty,
  isLoading,
}: BookingListProps) {
  const guestMap = new Map(guests.map((g) => [g.id, g]))
  const propertyMap = new Map(properties.map((p) => [p.id, p]))

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading bookings…</p>
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No bookings yet. Create a stay to see it here and on the calendar.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 lg:hidden">
        {bookings.map((booking) => {
          const guest = guestMap.get(booking.guest_id)
          return (
            <li key={booking.id}>
              <BookingCard
                booking={booking}
                guestName={guest ? guestDisplayName(guest) : "Guest"}
                propertyName={
                  propertyMap.get(booking.property_id)?.name ?? "Property"
                }
                unitLabel={resolveUnitLabel(booking, unitsByProperty)}
              />
            </li>
          )
        })}
      </ul>

      <div className="hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const guest = guestMap.get(booking.guest_id)
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.booking_reference}
                  </TableCell>
                  <TableCell>
                    {guest ? guestDisplayName(guest) : "—"}
                  </TableCell>
                  <TableCell>
                    {propertyMap.get(booking.property_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {resolveUnitLabel(booking, unitsByProperty)}
                  </TableCell>
                  <TableCell>{booking.check_in_date}</TableCell>
                  <TableCell>{booking.check_out_date}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={booking.payment_status} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
