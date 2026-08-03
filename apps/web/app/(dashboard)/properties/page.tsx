import type { Metadata } from "next"

import { PropertiesPageContent } from "@/components/properties/properties-list"

export const metadata: Metadata = {
  title: "Properties",
}

export default function PropertiesPage() {
  return <PropertiesPageContent />
}
