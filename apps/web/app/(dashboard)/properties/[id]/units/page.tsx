import type { Metadata } from "next"

import { UnitsPageContent } from "@/features/units/components/units-page"

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Manage units",
}

export default async function PropertyUnitsPage({ params }: PageProps) {
  const { id } = await params
  return <UnitsPageContent propertyId={id} />
}
