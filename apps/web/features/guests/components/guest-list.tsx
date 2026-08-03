"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  GuestCard,
  type GuestListStats,
} from "@/features/guests/components/guest-card"
import {
  guestDisplayName,
  guestInitials,
  type Guest,
} from "@/features/guests/schemas/guest-schema"

type GuestListProps = {
  guests: Guest[]
  statsByGuestId: Map<string, GuestListStats>
  isLoading?: boolean
}

export function GuestList({
  guests,
  statsByGuestId,
  isLoading,
}: GuestListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading guests…</p>
  }

  if (guests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No guests yet. Add a guest profile to start taking bookings.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {guests.map((guest) => (
          <li key={guest.id}>
            <GuestCard
              guest={guest}
              stats={statsByGuestId.get(guest.id)}
            />
          </li>
        ))}
      </ul>

      <div className="hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Total bookings</TableHead>
              <TableHead>Last stay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => {
              const stats = statsByGuestId.get(guest.id)
              return (
                <TableRow key={guest.id}>
                  <TableCell>
                    <Link
                      href={`/guests/${guest.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback>{guestInitials(guest)}</AvatarFallback>
                      </Avatar>
                      {guestDisplayName(guest)}
                    </Link>
                  </TableCell>
                  <TableCell>{guest.email || "—"}</TableCell>
                  <TableCell>{guest.phone || "—"}</TableCell>
                  <TableCell>{guest.country || "—"}</TableCell>
                  <TableCell>{stats?.totalBookings ?? 0}</TableCell>
                  <TableCell>{stats?.lastStay ?? "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
