"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookingStatusBadge } from "@/features/bookings/components/booking-status-badge"
import {
  useBookings,
  useGuests,
} from "@/features/bookings/hooks/use-bookings"
import {
  eachStayDate,
  guestDisplayName,
  toIsoDate,
  type Booking,
  type Guest,
} from "@/features/bookings/schemas/booking-schema"
import { useProperties } from "@/hooks/use-properties"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "checked_in"])

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function monthLabel(date: Date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" })
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month)
  const startPad = first.getDay()
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate()

  const cells: Array<{ date: Date | null; iso: string | null }> = []
  for (let i = 0; i < startPad; i += 1) {
    cells.push({ date: null, iso: null })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    cells.push({ date, iso: toIsoDate(date) })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, iso: null })
  }
  return cells
}

type DayInfo = {
  occupied: boolean
  bookings: Booking[]
}

export function BookingCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [propertyId, setPropertyId] = useState("")

  const propertiesQuery = useProperties()
  const bookingsQuery = useBookings(
    propertyId ? { property_id: propertyId } : undefined
  )
  const guestsQuery = useGuests()

  const guestMap = useMemo(() => {
    const map = new Map<string, Guest>()
    for (const guest of guestsQuery.data ?? []) map.set(guest.id, guest)
    return map
  }, [guestsQuery.data])

  const cells = useMemo(() => buildMonthCells(month), [month])

  const dayMap = useMemo(() => {
    const map = new Map<string, DayInfo>()
    const bookings = (bookingsQuery.data ?? []).filter((b) =>
      ACTIVE_STATUSES.has(b.status)
    )

    for (const booking of bookings) {
      for (const iso of eachStayDate(
        booking.check_in_date,
        booking.check_out_date
      )) {
        const existing = map.get(iso) ?? { occupied: false, bookings: [] }
        existing.occupied = true
        if (!existing.bookings.some((b) => b.id === booking.id)) {
          existing.bookings.push(booking)
        }
        map.set(iso, existing)
      }
    }
    return map
  }, [bookingsQuery.data])

  const monthBookings = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
    return (bookingsQuery.data ?? []).filter(
      (b) =>
        b.check_in_date.startsWith(prefix) ||
        b.check_out_date.startsWith(prefix) ||
        (b.check_in_date < `${prefix}-01` &&
          b.check_out_date > `${prefix}-01`)
    )
  }, [bookingsQuery.data, month])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <label htmlFor="calendar-property" className="text-sm font-medium">
            Property
          </label>
          <select
            id="calendar-property"
            className="flex h-9 min-w-[14rem] rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All properties</option>
            {(propertiesQuery.data ?? []).map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            Previous
          </Button>
          <p className="min-w-[10rem] text-center text-sm font-medium">
            {monthLabel(month)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald-500/40 ring-1 ring-emerald-600/30" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-500/50 ring-1 ring-amber-700/30" />
          Occupied
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted ring-1 ring-border" />
          Outside month
        </span>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Stay calendar</CardTitle>
          <CardDescription>
            Occupied nights come from active bookings (pending, confirmed,
            checked in). Open nights are available for new stays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell.iso || !cell.date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-16 rounded-md bg-muted/30"
                  />
                )
              }
              const info = dayMap.get(cell.iso)
              const occupied = Boolean(info?.occupied)
              return (
                <div
                  key={cell.iso}
                  className={cn(
                    "min-h-16 rounded-md border p-1.5 text-left",
                    occupied
                      ? "border-amber-600/30 bg-amber-500/15"
                      : "border-emerald-600/20 bg-emerald-500/10"
                  )}
                  title={
                    occupied
                      ? info?.bookings
                          .map((b) => b.booking_reference)
                          .join(", ")
                      : "Available"
                  }
                >
                  <p className="text-xs font-medium">{cell.date.getDate()}</p>
                  {occupied ? (
                    <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                      {info?.bookings
                        .map((b) => b.booking_reference)
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Open
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Current bookings</CardTitle>
          <CardDescription>
            Bookings overlapping {monthLabel(month)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : monthBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookings in this month.
            </p>
          ) : (
            <ul className="space-y-2">
              {monthBookings.map((booking) => {
                const guest = guestMap.get(booking.guest_id)
                return (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium">{booking.booking_reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {guest ? guestDisplayName(guest) : "Guest"} ·{" "}
                        {booking.check_in_date} → {booking.check_out_date}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
