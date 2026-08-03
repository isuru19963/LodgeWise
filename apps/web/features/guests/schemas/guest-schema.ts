import { z } from "zod"

export const identificationTypeSchema = z.enum([
  "passport",
  "national_id",
  "driving_license",
  "other",
])

export const guestSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  country: z.string().nullable(),
  identification_type: identificationTypeSchema.nullable(),
  identification_number: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const phoneRegex = /^\+?[0-9()\-\s.]{7,32}$/

export const guestFormSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  phone: z.union([
    z.literal(""),
    z.string().regex(phoneRegex, "Enter a valid phone number"),
  ]),
  country: z.string().max(100).optional().or(z.literal("")),
  identification_type: z.string().optional(),
  identification_number: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
})

export type IdentificationType = z.infer<typeof identificationTypeSchema>
export type Guest = z.infer<typeof guestSchema>
export type GuestFormInput = z.infer<typeof guestFormSchema>

export const IDENTIFICATION_TYPE_LABELS: Record<IdentificationType, string> = {
  passport: "Passport",
  national_id: "National ID",
  driving_license: "Driving license",
  other: "Other",
}

export function guestDisplayName(guest: Pick<Guest, "first_name" | "last_name">) {
  return `${guest.first_name} ${guest.last_name}`.trim()
}

export function guestInitials(guest: Pick<Guest, "first_name" | "last_name">) {
  const first = guest.first_name.charAt(0)
  const last = guest.last_name.charAt(0)
  return `${first}${last}`.toUpperCase() || "?"
}

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null
  return value.trim()
}
