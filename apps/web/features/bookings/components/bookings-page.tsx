"use client"

import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { BookingForm } from "@/features/bookings/components/booking-form"
import { BookingList } from "@/features/bookings/components/booking-list"
import {
  useBookings,
  useGuests,
} from "@/features/bookings/hooks/use-bookings"
import { useAuth } from "@/hooks/use-auth"
import { useProperties } from "@/hooks/use-properties"
import { unitService } from "@/features/units/services/unit-service"
import type { Unit } from "@/features/units/schemas/unit-schema"

export function BookingsPageContent() {
  const { isAuthenticated } = useAuth()
  const bookingsQuery = useBookings()
  const guestsQuery = useGuests()
  const propertiesQuery = useProperties()

  const propertyIds = useMemo(() => {
    const ids = new Set(
      (bookingsQuery.data ?? []).map((booking) => booking.property_id)
    )
    return [...ids]
  }, [bookingsQuery.data])

  const unitQueries = useQueries({
    queries: propertyIds.map((propertyId) => ({
      queryKey: ["units", propertyId],
      queryFn: () => unitService.listUnits(propertyId),
      enabled: isAuthenticated && Boolean(propertyId),
    })),
  })

  const unitsByProperty = useMemo(() => {
    const map = new Map<string, Unit[]>()
    propertyIds.forEach((propertyId, index) => {
      map.set(propertyId, unitQueries[index]?.data ?? [])
    })
    return map
  }, [propertyIds, unitQueries])

  const isLoading =
    bookingsQuery.isLoading ||
    guestsQuery.isLoading ||
    propertiesQuery.isLoading

  return (
    <PageShell>
      <Header
        title="Bookings"
        description="Reservations across your properties — create, modify, and track stay status."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading bookings…"
            : `${bookingsQuery.data?.length ?? 0} booking${
                (bookingsQuery.data?.length ?? 0) === 1 ? "" : "s"
              }`}
        </p>
        <BookingForm />
      </div>

      {bookingsQuery.isError ? (
        <EmptyState
          title="Could not load bookings"
          description={
            bookingsQuery.error instanceof Error
              ? bookingsQuery.error.message
              : "Something went wrong. Try again shortly."
          }
        />
      ) : !isLoading && (bookingsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Create a booking with a guest, property, unit, and stay dates. Availability is checked on the server."
        />
      ) : (
        <BookingList
          bookings={bookingsQuery.data ?? []}
          guests={guestsQuery.data ?? []}
          properties={propertiesQuery.data ?? []}
          unitsByProperty={unitsByProperty}
          isLoading={isLoading}
        />
      )}
    </PageShell>
  )
}
