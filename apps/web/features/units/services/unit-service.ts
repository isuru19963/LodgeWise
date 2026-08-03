import { apiClient } from "@/lib/api-client"
import {
  unitSchema,
  unitTypeSchema,
  type CreateUnitFormInput,
  type Unit,
  type UnitStatus,
  type UnitType,
} from "@/features/units/schemas/unit-schema"

export type CreateUnitPayload = {
  property_id: string
  unit_type_id: string
  name: string
  code: string
  status?: UnitStatus
}

export type CreateUnitTypePayload = {
  property_id: string
  name: string
  description?: string | null
  max_adults: number
  max_children: number
  base_price: number
}

export const unitService = {
  async listUnits(propertyId: string): Promise<Unit[]> {
    const data = await apiClient<unknown>(
      `/units?property_id=${encodeURIComponent(propertyId)}`
    )
    return unitSchema.array().parse(data)
  },

  async createUnit(payload: CreateUnitPayload): Promise<Unit> {
    const data = await apiClient<unknown>("/units", {
      method: "POST",
      body: {
        property_id: payload.property_id,
        unit_type_id: payload.unit_type_id,
        name: payload.name.trim(),
        code: payload.code.trim(),
        status: payload.status ?? "available",
      },
    })
    return unitSchema.parse(data)
  },

  async listUnitTypes(propertyId: string): Promise<UnitType[]> {
    const data = await apiClient<unknown>(
      `/unit-types?property_id=${encodeURIComponent(propertyId)}`
    )
    return unitTypeSchema.array().parse(data)
  },

  async createUnitType(payload: CreateUnitTypePayload): Promise<UnitType> {
    const data = await apiClient<unknown>("/unit-types", {
      method: "POST",
      body: {
        property_id: payload.property_id,
        name: payload.name.trim(),
        description: payload.description ?? null,
        max_adults: payload.max_adults,
        max_children: payload.max_children,
        base_price: payload.base_price,
      },
    })
    return unitTypeSchema.parse(data)
  },

  /**
   * Resolve unit type (reuse or create), then POST /units.
   * Capacity and price live on the unit type in the API.
   */
  async createUnitWithType(
    propertyId: string,
    input: CreateUnitFormInput
  ): Promise<{ unit: Unit; unitType: UnitType }> {
    const existingTypes = await this.listUnitTypes(propertyId)
    const byId = input.unit_type_id
      ? existingTypes.find((t) => t.id === input.unit_type_id)
      : undefined
    const byName = existingTypes.find(
      (t) => t.name.toLowerCase() === input.unit_type_name.trim().toLowerCase()
    )

    let unitType = byId ?? byName

    if (!unitType) {
      unitType = await this.createUnitType({
        property_id: propertyId,
        name: input.unit_type_name,
        max_adults: input.max_adults,
        max_children: input.max_children,
        base_price: input.base_price,
      })
    }

    const unit = await this.createUnit({
      property_id: propertyId,
      unit_type_id: unitType.id,
      name: input.name,
      code: input.code,
      status: input.status,
    })

    return { unit, unitType }
  },
}
