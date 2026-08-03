import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"

export const metadata: Metadata = {
  title: "Settings",
}

export default function SettingsPage() {
  return (
    <PageShell>
      <Header
        title="Settings"
        description="Organization profile, members, and preferences."
      />
      <EmptyState
        title="Settings coming soon"
        description="Organization and user management screens will use the existing auth and tenancy APIs."
        actionLabel="Edit organization later"
      />
    </PageShell>
  )
}
