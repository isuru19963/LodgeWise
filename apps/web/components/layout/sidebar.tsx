"use client"

import Link from "next/link"
import { useState } from "react"
import { List, X } from "@phosphor-icons/react"

import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Brand() {
  return (
    <Link href="/overview" className="flex items-center gap-2 px-1">
      <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
        L
      </span>
      <span className="text-sm font-semibold tracking-tight">Lodgwise AI</span>
    </Link>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed left-3 top-3 z-50 md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-4" /> : <List className="size-4" />}
      </Button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <Navigation onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">Foundation preview</p>
          <p className="mt-0.5 text-xs text-muted-foreground/80">
            API not connected yet
          </p>
        </div>
      </aside>
    </>
  )
}
