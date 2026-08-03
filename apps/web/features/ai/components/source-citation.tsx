"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChatSource } from "@/features/ai/types/ai-types"

type SourceCitationProps = {
  sources: ChatSource[]
}

export function SourceCitation({ sources }: SourceCitationProps) {
  if (sources.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Sources
      </p>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={`${source.document_id}-${source.score}`}>
            <Card className="shadow-none">
              <CardHeader className="gap-1 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-medium">
                    {source.document_title}
                  </CardTitle>
                  <Badge variant="outline">
                    {(source.score * 100).toFixed(0)}% match
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3 text-xs">
                  {source.content}
                </CardDescription>
                <p className="text-[10px] text-muted-foreground">
                  Knowledge source · {source.document_id.slice(0, 8)}
                </p>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
