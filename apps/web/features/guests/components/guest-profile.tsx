"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBookings } from "@/features/bookings/hooks/use-bookings"
import { BookingHistory } from "@/features/guests/components/booking-history"
import { useGuest } from "@/features/guests/hooks/use-guests"
import {
  guestDisplayName,
  guestInitials,
  IDENTIFICATION_TYPE_LABELS,
} from "@/features/guests/schemas/guest-schema"
import { useProperties } from "@/hooks/use-properties"

type GuestProfileProps = {
  guestId: string
}

export function GuestProfile({ guestId }: GuestProfileProps) {
  const guestQuery = useGuest(guestId)
  const bookingsQuery = useBookings({ guest_id: guestId })
  const propertiesQuery = useProperties()

  const bookings = bookingsQuery.data ?? []
  const properties = propertiesQuery.data ?? []

  const previousProperties = useMemo(() => {
    const ids = [...new Set(bookings.map((b) => b.property_id))]
    return ids
      .map((id) => properties.find((p) => p.id === id)?.name)
      .filter((name): name is string => Boolean(name))
  }, [bookings, properties])

  const totalStays = bookings.filter(
    (b) => b.status === "checked_out" || b.status === "checked_in"
  ).length

  if (guestQuery.isError) {
    return (
      <PageShell>
        <Header title="Guest" description="Guest not found." />
        <EmptyState
          title="Guest not found"
          description="This guest may have been removed or you do not have access."
          actionLabel="Back to guests"
          actionHref="/guests"
        />
      </PageShell>
    )
  }

  const guest = guestQuery.data

  return (
    <PageShell>
      <Header
        title={guest ? guestDisplayName(guest) : "Guest"}
        description="Guest profile, stay history, and notes for personalization later."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/guests">Back to guests</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/bookings">Create booking</Link>
        </Button>
      </div>

      {guestQuery.isLoading || !guest ? (
        <p className="text-sm text-muted-foreground">Loading guest…</p>
      ) : (
        <>
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <Avatar className="size-14">
                <AvatarFallback className="text-sm">
                  {guestInitials(guest)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  {guestDisplayName(guest)}
                </CardTitle>
                <CardDescription>
                  {guest.email || "No email"} · {guest.phone || "No phone"}
                  {guest.country ? ` · ${guest.country}` : ""}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{bookings.length} bookings</Badge>
                  <Badge variant="outline">{totalStays} stays</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Booking history</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Guest information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <InfoRow label="Email" value={guest.email} />
                    <InfoRow label="Phone" value={guest.phone} />
                    <InfoRow label="Country" value={guest.country} />
                    <InfoRow
                      label="ID type"
                      value={
                        guest.identification_type
                          ? IDENTIFICATION_TYPE_LABELS[guest.identification_type]
                          : null
                      }
                    />
                    <InfoRow
                      label="ID number"
                      value={guest.identification_number}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Stay summary</CardTitle>
                    <CardDescription>
                      Prepared for future AI guest personalization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <InfoRow
                      label="Total bookings"
                      value={String(bookings.length)}
                    />
                    <InfoRow label="Total stays" value={String(totalStays)} />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Previous properties
                      </p>
                      {previousProperties.length === 0 ? (
                        <p className="mt-1">None yet</p>
                      ) : (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {previousProperties.map((name) => (
                            <li key={name}>
                              <Badge variant="outline">{name}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Booking history</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingHistory
                    bookings={bookings}
                    properties={properties}
                    isLoading={bookingsQuery.isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                  <CardDescription>
                    Staff notes for future personalization features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {guest.notes?.trim() || "No notes yet."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PageShell>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  )
}
