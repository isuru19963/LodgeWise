"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import {
  useProperties,
  usePropertyTypes,
} from "@/hooks/use-properties"
import {
  formatPropertyTypeName,
  type Property,
  type PropertyType,
} from "@/lib/properties"

function canCreateProperty(role: string | undefined): boolean {
  return role === "owner" || role === "admin"
}

function typeLabel(
  property: Property,
  types: PropertyType[] | undefined
): string {
  const match = types?.find((t) => t.id === property.property_type_id)
  return match ? formatPropertyTypeName(match.name) : "Property"
}

export function PropertiesPageContent() {
  const { user } = useAuth()
  const propertiesQuery = useProperties()
  const typesQuery = usePropertyTypes()

  const allowCreate = canCreateProperty(user?.role)

  const sorted = useMemo(() => {
    const properties = propertiesQuery.data ?? []
    return [...properties].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    )
  }, [propertiesQuery.data])

  return (
    <PageShell>
      <Header
        title="Properties"
        description="Hotels, villas, resorts, and every other property type in your portfolio."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {propertiesQuery.isLoading
            ? "Loading properties…"
            : `${sorted.length} propert${sorted.length === 1 ? "y" : "ies"}`}
        </p>
        {allowCreate ? (
          <Button asChild size="sm">
            <Link href="/properties/new">Add property</Link>
          </Button>
        ) : null}
      </div>

      {propertiesQuery.isError ? (
        <EmptyState
          title="Could not load properties"
          description={
            propertiesQuery.error instanceof Error
              ? propertiesQuery.error.message
              : "Something went wrong. Try again shortly."
          }
        />
      ) : null}

      {!propertiesQuery.isLoading &&
      !propertiesQuery.isError &&
      sorted.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Add your first hotel, villa, resort, cabana, or hostel to start managing inventory."
          actionLabel={allowCreate ? "Add property" : undefined}
          actionHref={allowCreate ? "/properties/new" : undefined}
        />
      ) : null}

      {sorted.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((property) => (
            <li key={property.id}>
              <Card className="h-full shadow-none">
                <CardHeader className="gap-2">
                  <CardDescription>
                    {typeLabel(property, typesQuery.data)}
                  </CardDescription>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    {property.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {[property.city, property.country]
                      .filter(Boolean)
                      .join(", ") || "Location not set"}
                  </p>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}/units`}>
                        Manage units
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  )
}
