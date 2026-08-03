"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

type HeaderProps = {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { user, organization, isAuthenticated, isLoading, logout } = useAuth()

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : null

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 pl-11 md:pl-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 pl-11 md:pl-0">
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : isAuthenticated ? (
          <>
            <div className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[12rem] truncate text-xs text-muted-foreground">
                {organization?.name ?? displayName}
              </span>
            </div>
            <Button variant="outline" size="sm" type="button" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : null}
      </div>
    </header>
  )
}
