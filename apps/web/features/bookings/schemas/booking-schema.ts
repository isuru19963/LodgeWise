import { z } from "zod"

const moneySchema = z.union([z.string(), z.number()])
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
])

export const paymentStatusSchema = z.enum([
  "unpaid",
  "partial",
  "paid",
  "refunded",
])

export const bookingItemSchema = z.object({
  id: z.string().uuid(),
  unit_id: z.string().uuid(),
  price: moneySchema,
  quantity: z.number().int(),
})

export const bookingSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  property_id: z.string().uuid(),
  guest_id: z.string().uuid(),
  booking_reference: z.string(),
  check_in_date: isoDateSchema,
  check_out_date: isoDateSchema,
  adults: z.number().int(),
  children: z.number().int(),
  status: bookingStatusSchema,
  total_amount: moneySchema,
  payment_status: paymentStatusSchema,
  items: z.array(bookingItemSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export const guestSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  identification_type: z
    .enum(["passport", "national_id", "driving_license", "other"])
    .nullable(),
  identification_number: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const availableUnitSchema = z.object({
  unit_id: z.string().uuid(),
  property_id: z.string().uuid(),
  unit_type_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  base_price: moneySchema,
  nights: z.array(
    z.object({
      date: isoDateSchema,
      base_price: moneySchema,
      final_price: moneySchema,
      applied_rules: z.array(z.unknown()),
    })
  ),
  total_price: moneySchema,
})

export const availabilityResponseSchema = z.object({
  property_id: z.string().uuid(),
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  units: z.array(availableUnitSchema),
})

/** UI form — notes map to guest notes when creating a guest. */
export const bookingFormSchema = z
  .object({
    guest_id: z.union([z.string().uuid(), z.literal("")]),
    property_id: z.string().uuid("Select a property"),
    unit_id: z.string().uuid("Select a unit"),
    check_in_date: isoDateSchema,
    check_out_date: isoDateSchema,
    adults: z.number().int().min(1, "At least 1 adult").max(100),
    children: z.number().int().min(0, "Cannot be negative").max(100),
    notes: z.string().max(2000).optional().or(z.literal("")),
    unit_price: z.number().min(0).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.check_out_date <= value.check_in_date) {
      ctx.addIssue({
        code: "custom",
        path: ["check_out_date"],
        message: "Check-out must be after check-in",
      })
    }
    const checkIn = new Date(`${value.check_in_date}T00:00:00`)
    if (Number.isNaN(checkIn.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["check_in_date"],
        message: "Invalid check-in date",
      })
    }
  })

export const bookingFormWithGuestSchema = bookingFormSchema.superRefine(
  (value, ctx) => {
    if (!value.guest_id) {
      ctx.addIssue({
        code: "custom",
        path: ["guest_id"],
        message: "Select a guest",
      })
    }
  }
)

export type BookingStatus = z.infer<typeof bookingStatusSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type Booking = z.infer<typeof bookingSchema>
export type BookingItem = z.infer<typeof bookingItemSchema>
export type Guest = z.infer<typeof guestSchema>
export type AvailableUnit = z.infer<typeof availableUnitSchema>
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>
export type BookingFormInput = z.infer<typeof bookingFormSchema>

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  refunded: "Refunded",
}

export function guestDisplayName(guest: Guest): string {
  return `${guest.first_name} ${guest.last_name}`.trim()
}

export function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Inclusive stay nights as YYYY-MM-DD for [checkIn, checkOut). */
export function eachStayDate(
  checkIn: string,
  checkOut: string
): string[] {
  const dates: string[] = []
  const cursor = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  while (cursor < end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, "0")
    const d = String(cursor.getDate()).padStart(2, "0")
    dates.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
