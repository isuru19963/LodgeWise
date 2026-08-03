"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  guestDisplayName,
  guestInitials,
  type Guest,
} from "@/features/guests/schemas/guest-schema"

export type GuestListStats = {
  totalBookings: number
  lastStay: string | null
}

type GuestCardProps = {
  guest: Guest
  stats?: GuestListStats
}

export function GuestCard({ guest, stats }: GuestCardProps) {
  return (
    <Link href={`/guests/${guest.id}`} className="block">
      <Card className="h-full shadow-none transition-colors hover:bg-muted/30">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{guestInitials(guest)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold tracking-tight">
                {guestDisplayName(guest)}
              </CardTitle>
              <CardDescription className="truncate">
                {guest.email || "No email"}
              </CardDescription>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {guest.phone || "No phone"}
            {guest.country ? ` · ${guest.country}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats?.totalBookings ?? 0} booking
            {(stats?.totalBookings ?? 0) === 1 ? "" : "s"}
            {stats?.lastStay ? ` · Last stay ${stats.lastStay}` : ""}
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
}
