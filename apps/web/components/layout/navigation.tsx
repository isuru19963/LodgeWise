"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Buildings,
  CalendarBlank,
  CalendarCheck,
  ChartLine,
  CreditCard,
  GearSix,
  House,
  Robot,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react"

import { dashboardNav, type NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const icons: Record<NavItem["icon"], Icon> = {
  overview: House,
  properties: Buildings,
  bookings: CalendarCheck,
  guests: UsersThree,
  calendar: CalendarBlank,
  ai: Robot,
  analytics: ChartLine,
  billing: CreditCard,
  settings: GearSix,
}

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Main">
      {dashboardNav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = icons[item.icon]

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
            )}
          >
            <Icon
              weight={active ? "fill" : "regular"}
              className="size-4 shrink-0"
              aria-hidden
            />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
