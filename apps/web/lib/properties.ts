import { z } from "zod"

export const unitStatusSchema = z.enum([
  "available",
  "maintenance",
  "out_of_service",
])

export const propertyTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
})

export const propertySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  property_type_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  timezone: z.string(),
  currency: z.string(),
  check_in_time: z.string(),
  check_out_time: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const propertyDetailsSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name is too long"),
  description: z.string().max(2000).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required").max(64),
  currency: z.string().length(3, "Use a 3-letter currency code"),
  check_in_time: z.string().min(1, "Check-in time is required"),
  check_out_time: z.string().min(1, "Check-out time is required"),
})

export const unitTypeSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  property_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  max_adults: z.number().int(),
  max_children: z.number().int(),
  base_price: z.union([z.string(), z.number()]),
  created_at: z.string(),
})

export const unitTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().optional().or(z.literal("")),
  max_adults: z.number().int().min(1).max(50),
  max_children: z.number().int().min(0).max(50),
  base_price: z.number().min(0, "Price must be 0 or greater"),
})

export const unitSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  property_id: z.string().uuid(),
  unit_type_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  status: unitStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const unitFormSchema = z.object({
  unit_type_id: z.string().uuid("Select a unit type"),
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(50),
  status: unitStatusSchema,
})

export type UnitStatus = z.infer<typeof unitStatusSchema>
export type PropertyType = z.infer<typeof propertyTypeSchema>
export type Property = z.infer<typeof propertySchema>
export type PropertyDetailsInput = z.infer<typeof propertyDetailsSchema>
export type UnitType = z.infer<typeof unitTypeSchema>
export type UnitTypeFormInput = z.infer<typeof unitTypeFormSchema>
export type Unit = z.infer<typeof unitSchema>
export type UnitFormInput = z.infer<typeof unitFormSchema>

/** Preferred display order for the type picker. */
export const PROPERTY_TYPE_ORDER = [
  "HOTEL",
  "VILLA",
  "RESORT",
  "CABANA",
  "HOSTEL",
  "GUEST_HOUSE",
  "APARTMENT",
  "OTHER",
] as const

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  VILLA: "Villa",
  RESORT: "Resort",
  CABANA: "Cabana",
  HOSTEL: "Hostel",
  GUEST_HOUSE: "Guest House",
  APARTMENT: "Apartment",
  OTHER: "Other",
}

export function formatPropertyTypeName(name: string): string {
  return (
    PROPERTY_TYPE_LABELS[name] ??
    name
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

export function sortPropertyTypes(types: PropertyType[]): PropertyType[] {
  const rank = new Map(
    PROPERTY_TYPE_ORDER.map((name, index) => [name, index])
  )
  return [...types].sort((a, b) => {
    const aRank = rank.get(a.name as (typeof PROPERTY_TYPE_ORDER)[number]) ?? 99
    const bRank = rank.get(b.name as (typeof PROPERTY_TYPE_ORDER)[number]) ?? 99
    return aRank - bRank || a.name.localeCompare(b.name)
  })
}

/** Normalize HTML time (`HH:MM`) to API time (`HH:MM:SS`). */
export function toApiTime(value: string): string {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null
  return value.trim()
}
