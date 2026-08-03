"use client"

import Link from "next/link"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { Button } from "@/components/ui/button"
import { UnitForm } from "@/features/units/components/unit-form"
import { UnitList } from "@/features/units/components/unit-list"
import { useUnits, useUnitTypes } from "@/features/units/hooks/use-units"
import { useProperty } from "@/hooks/use-properties"

type UnitsPageContentProps = {
  propertyId: string
}

export function UnitsPageContent({ propertyId }: UnitsPageContentProps) {
  const propertyQuery = useProperty(propertyId)
  const unitsQuery = useUnits(propertyId)
  const unitTypesQuery = useUnitTypes(propertyId)

  const propertyName = propertyQuery.data?.name ?? "Property"
  const units = unitsQuery.data ?? []
  const unitTypes = unitTypesQuery.data ?? []

  if (propertyQuery.isError) {
    return (
      <PageShell>
        <Header title="Manage units" description="Property not found." />
        <EmptyState
          title="Property not found"
          description="This property may have been removed or you do not have access."
          actionLabel="Back to properties"
          actionHref="/properties"
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Header
        title="Manage units"
        description={`${propertyName} — inventory rooms, cabanas, villas, and beds.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/properties">Back to properties</Link>
        </Button>
        <UnitForm propertyId={propertyId} />
      </div>

      {unitsQuery.isError ? (
        <EmptyState
          title="Could not load units"
          description={
            unitsQuery.error instanceof Error
              ? unitsQuery.error.message
              : "Something went wrong loading units."
          }
        />
      ) : (
        <UnitList
          units={units}
          unitTypes={unitTypes}
          isLoading={unitsQuery.isLoading || unitTypesQuery.isLoading}
        />
      )}
    </PageShell>
  )
}
