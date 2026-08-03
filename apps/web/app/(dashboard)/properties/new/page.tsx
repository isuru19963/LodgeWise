import type { Metadata } from "next"

import { AddPropertyWizard } from "@/components/properties/add-property-wizard"

export const metadata: Metadata = {
  title: "Add property",
}

export default function AddPropertyPage() {
  return <AddPropertyWizard />
}
