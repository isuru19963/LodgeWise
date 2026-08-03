import { apiClient } from "@/lib/api-client"
import {
  emptyToNull,
  propertySchema,
  propertyTypeSchema,
  toApiTime,
  unitSchema,
  unitTypeSchema,
  type Property,
  type PropertyDetailsInput,
  type PropertyType,
  type Unit,
  type UnitFormInput,
  type UnitStatus,
  type UnitType,
  type UnitTypeFormInput,
} from "@/lib/properties"

export type PropertyCreatePayload = PropertyDetailsInput & {
  property_type_id: string
}

export const propertyService = {
  async listPropertyTypes(): Promise<PropertyType[]> {
    const data = await apiClient<unknown>("/property-types")
    return propertyTypeSchema.array().parse(data)
  },

  async listProperties(): Promise<Property[]> {
    const data = await apiClient<unknown>("/properties")
    return propertySchema.array().parse(data)
  },

  async getProperty(propertyId: string): Promise<Property> {
    const data = await apiClient<unknown>(`/properties/${propertyId}`)
    return propertySchema.parse(data)
  },

  async createProperty(input: PropertyCreatePayload): Promise<Property> {
    const body = {
      property_type_id: input.property_type_id,
      name: input.name.trim(),
      description: emptyToNull(input.description),
      address: emptyToNull(input.address),
      city: emptyToNull(input.city),
      country: emptyToNull(input.country),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      timezone: input.timezone || "UTC",
      currency: (input.currency || "USD").toUpperCase(),
      check_in_time: toApiTime(input.check_in_time || "14:00"),
      check_out_time: toApiTime(input.check_out_time || "11:00"),
    }
    const data = await apiClient<unknown>("/properties", {
      method: "POST",
      body,
    })
    return propertySchema.parse(data)
  },

  async listUnitTypes(propertyId: string): Promise<UnitType[]> {
    const data = await apiClient<unknown>(
      `/unit-types?property_id=${encodeURIComponent(propertyId)}`
    )
    return unitTypeSchema.array().parse(data)
  },

  async createUnitType(
    propertyId: string,
    input: UnitTypeFormInput
  ): Promise<UnitType> {
    const data = await apiClient<unknown>("/unit-types", {
      method: "POST",
      body: {
        property_id: propertyId,
        name: input.name.trim(),
        description: emptyToNull(input.description),
        max_adults: input.max_adults,
        max_children: input.max_children,
        base_price: input.base_price,
      },
    })
    return unitTypeSchema.parse(data)
  },

  async listUnits(propertyId: string): Promise<Unit[]> {
    const data = await apiClient<unknown>(
      `/units?property_id=${encodeURIComponent(propertyId)}`
    )
    return unitSchema.array().parse(data)
  },

  async createUnit(propertyId: string, input: UnitFormInput): Promise<Unit> {
    const data = await apiClient<unknown>("/units", {
      method: "POST",
      body: {
        property_id: propertyId,
        unit_type_id: input.unit_type_id,
        name: input.name.trim(),
        code: input.code.trim(),
        status: (input.status ?? "available") as UnitStatus,
      },
    })
    return unitSchema.parse(data)
  },
}
