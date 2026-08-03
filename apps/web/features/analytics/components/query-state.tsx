"use client"

import { ApiError } from "@/lib/api-client"

type QueryStateProps = {
  isLoading: boolean
  isError: boolean
  error: unknown
  isEmpty?: boolean
  emptyMessage?: string
  loadingMessage?: string
}

export function QueryStateMessage({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage = "No data yet.",
  loadingMessage = "Loading…",
}: QueryStateProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{loadingMessage}</p>
  }

  if (isError) {
    const detail =
      error instanceof ApiError
        ? error.detail
        : error instanceof Error
          ? error.message
          : "Could not load analytics."
    return (
      <p className="text-sm text-destructive" role="alert">
        {detail}
      </p>
    )
  }

  if (isEmpty) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return null
}
