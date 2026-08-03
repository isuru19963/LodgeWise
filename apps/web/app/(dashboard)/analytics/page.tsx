import type { Metadata } from "next"

import { AnalyticsPageContent } from "@/features/analytics/components/analytics-page"

export const metadata: Metadata = {
  title: "Analytics",
}

export default function AnalyticsPage() {
  return <AnalyticsPageContent />
}
