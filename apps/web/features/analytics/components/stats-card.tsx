"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatsCardProps = {
  label: string
  value: string
  hint?: string
  className?: string
}

export function StatsCard({ label, value, hint, className }: StatsCardProps) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardHeader className="gap-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {value}
        </CardTitle>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardHeader>
    </Card>
  )
}
