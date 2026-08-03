"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/features/bookings/components/booking-status-badge"
import {
  formatMoney,
  type Booking,
} from "@/features/bookings/schemas/booking-schema"

type BookingCardProps = {
  booking: Booking
  guestName: string
  propertyName: string
  unitLabel: string
}

export function BookingCard({
  booking,
  guestName,
  propertyName,
  unitLabel,
}: BookingCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>
        <CardTitle className="text-base font-semibold tracking-tight">
          {booking.booking_reference}
        </CardTitle>
        <CardDescription>
          {guestName} · {propertyName}
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          {unitLabel} · {booking.check_in_date} → {booking.check_out_date}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(booking.total_amount)} · {booking.adults}A/
          {booking.children}C
        </p>
      </CardHeader>
    </Card>
  )
}
