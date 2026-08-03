"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatUnitStatus,
  type Unit,
  type UnitType,
} from "@/features/units/schemas/unit-schema"

type UnitCardProps = {
  unit: Unit
  unitTypeName?: string
}

export function UnitCard({ unit, unitTypeName }: UnitCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="gap-2">
        <CardDescription className="capitalize">
          {formatUnitStatus(unit.status)}
        </CardDescription>
        <CardTitle className="text-base font-semibold tracking-tight">
          {unit.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Code {unit.code}
          {unitTypeName ? ` · ${unitTypeName}` : null}
        </p>
      </CardHeader>
    </Card>
  )
}

type UnitCardsProps = {
  units: Unit[]
  unitTypes: UnitType[]
}

export function UnitCards({ units, unitTypes }: UnitCardsProps) {
  const typeMap = new Map(unitTypes.map((t) => [t.id, t.name]))

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
      {units.map((unit) => (
        <li key={unit.id}>
          <UnitCard
            unit={unit}
            unitTypeName={typeMap.get(unit.unit_type_id)}
          />
        </li>
      ))}
    </ul>
  )
}
