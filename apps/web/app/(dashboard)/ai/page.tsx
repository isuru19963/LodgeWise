import type { Metadata } from "next"

import { AiPageContent } from "@/features/ai/components/ai-page"

export const metadata: Metadata = {
  title: "AI Assistant",
}

export default function AiPage() {
  return <AiPageContent />
}
