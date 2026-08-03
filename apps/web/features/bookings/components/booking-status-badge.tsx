"use client"

import { Badge } from "@/components/ui/badge"
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type BookingStatus,
  type PaymentStatus,
} from "@/features/bookings/schemas/booking-schema"

const bookingVariant: Record<
  BookingStatus,
  "warning" | "success" | "default" | "muted" | "destructive" | "secondary"
> = {
  pending: "warning",
  confirmed: "success",
  checked_in: "default",
  checked_out: "muted",
  cancelled: "destructive",
}

const paymentVariant: Record<
  PaymentStatus,
  "warning" | "success" | "muted" | "secondary"
> = {
  unpaid: "warning",
  partial: "secondary",
  paid: "success",
  refunded: "muted",
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={bookingVariant[status]}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={paymentVariant[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
