"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UnitCards } from "@/features/units/components/unit-card"
import {
  formatUnitStatus,
  type Unit,
  type UnitType,
} from "@/features/units/schemas/unit-schema"

type UnitListProps = {
  units: Unit[]
  unitTypes: UnitType[]
  isLoading?: boolean
}

export function UnitList({ units, unitTypes, isLoading }: UnitListProps) {
  const typeMap = new Map(unitTypes.map((t) => [t.id, t.name]))

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading units…</p>
  }

  if (units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No units yet. Add a room, cabana, villa, dorm bed, suite, or apartment.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <UnitCards units={units} unitTypes={unitTypes} />

      <div className="hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Unit type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.code}</TableCell>
                <TableCell>
                  {typeMap.get(unit.unit_type_id) ?? "—"}
                </TableCell>
                <TableCell className="capitalize">
                  {formatUnitStatus(unit.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
