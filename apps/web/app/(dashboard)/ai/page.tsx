import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "AI Assistant",
}

export default function AiPage() {
  return (
    <PageShell>
      <Header
        title="AI Assistant"
        description="Property knowledge chat grounded in your documents. No live model calls from this UI yet."
      />
      <EmptyState
        title="Assistant idle"
        description="Upload knowledge documents and chat through the API first. The dashboard chat surface will connect next."
        actionLabel="Open chat later"
      />
    </PageShell>
  )
}
