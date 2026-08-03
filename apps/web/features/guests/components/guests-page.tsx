"use client"

import { useMemo, useState } from "react"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { Input } from "@/components/ui/input"
import { useBookings } from "@/features/bookings/hooks/use-bookings"
import { GuestForm } from "@/features/guests/components/guest-form"
import { GuestList } from "@/features/guests/components/guest-list"
import type { GuestListStats } from "@/features/guests/components/guest-card"
import { useGuests } from "@/features/guests/hooks/use-guests"

export function GuestsPageContent() {
  const [search, setSearch] = useState("")
  const guestsQuery = useGuests(search.trim() || undefined)
  const bookingsQuery = useBookings()

  const statsByGuestId = useMemo(() => {
    const map = new Map<string, GuestListStats>()
    for (const booking of bookingsQuery.data ?? []) {
      const existing = map.get(booking.guest_id) ?? {
        totalBookings: 0,
        lastStay: null as string | null,
      }
      existing.totalBookings += 1
      const stayEnd = booking.check_out_date
      if (!existing.lastStay || stayEnd > existing.lastStay) {
        existing.lastStay = stayEnd
      }
      map.set(booking.guest_id, existing)
    }
    return map
  }, [bookingsQuery.data])

  const guests = useMemo(() => {
    const list = guestsQuery.data ?? []
    return [...list].sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`,
        undefined,
        { sensitivity: "base" }
      )
    )
  }, [guestsQuery.data])

  const isLoading = guestsQuery.isLoading || bookingsQuery.isLoading

  return (
    <PageShell>
      <Header
        title="Guests"
        description="Guest profiles shared across every property in your organization."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search guests…"
          className="max-w-xs"
        />
        <GuestForm />
      </div>

      {guestsQuery.isError ? (
        <EmptyState
          title="Could not load guests"
          description={
            guestsQuery.error instanceof Error
              ? guestsQuery.error.message
              : "Something went wrong. Try again shortly."
          }
        />
      ) : !isLoading && guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add a guest profile, then attach them when creating bookings."
        />
      ) : (
        <GuestList
          guests={guests}
          statsByGuestId={statsByGuestId}
          isLoading={isLoading}
        />
      )}
    </PageShell>
  )
}
