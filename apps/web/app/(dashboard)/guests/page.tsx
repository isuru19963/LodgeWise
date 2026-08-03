import type { Metadata } from "next"

import { GuestsPageContent } from "@/features/guests/components/guests-page"

export const metadata: Metadata = {
  title: "Guests",
}

export default function GuestsPage() {
  return <GuestsPageContent />
}
