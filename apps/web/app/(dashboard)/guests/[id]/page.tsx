import type { Metadata } from "next"

import { GuestProfile } from "@/features/guests/components/guest-profile"

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Guest profile",
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params
  return <GuestProfile guestId={id} />
}
