import Link from "next/link"

import { Button } from "@/components/ui/button"

type HeaderProps = {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
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
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <div className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 sm:flex">
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Demo workspace</span>
        </div>
      </div>
    </header>
  )
}
