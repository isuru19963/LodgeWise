import { z } from "zod"

export const unitStatusSchema = z.enum([
  "available",
  "maintenance",
  "out_of_service",
])

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

/** Suggested unit type labels for the type selector. */
export const UNIT_TYPE_PRESETS = [
  "Deluxe Room",
  "Standard Room",
  "Private Villa",
  "Cabana",
  "Dormitory",
  "Suite",
] as const

/** Example unit names shown as placeholders / hints. */
export const UNIT_NAME_EXAMPLES = [
  "Room",
  "Cabana",
  "Villa",
  "Dorm Bed",
  "Suite",
  "Apartment",
] as const

export const createUnitFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    code: z.string().min(1, "Code is required").max(50),
    unit_type_id: z.union([z.string().uuid(), z.literal("")]).optional(),
    unit_type_name: z.string().min(1, "Unit type is required").max(150),
    max_adults: z.number().int().min(1, "At least 1 adult").max(50),
    max_children: z.number().int().min(0, "Cannot be negative").max(50),
    base_price: z.number().positive("Price must be positive"),
    status: unitStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (value.max_adults + value.max_children < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["max_adults"],
        message: "Capacity must allow at least one guest",
      })
    }
  })

export type UnitStatus = z.infer<typeof unitStatusSchema>
export type UnitType = z.infer<typeof unitTypeSchema>
export type Unit = z.infer<typeof unitSchema>
export type CreateUnitFormInput = z.infer<typeof createUnitFormSchema>

export function formatUnitStatus(status: UnitStatus): string {
  return status.replaceAll("_", " ")
}
