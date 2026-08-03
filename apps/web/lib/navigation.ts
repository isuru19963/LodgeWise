export type NavItem = {
  title: string
  href: string
  icon:
    | "overview"
    | "properties"
    | "bookings"
    | "guests"
    | "calendar"
    | "ai"
    | "analytics"
    | "billing"
    | "settings"
}

export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/overview", icon: "overview" },
  { title: "Properties", href: "/properties", icon: "properties" },
  { title: "Bookings", href: "/bookings", icon: "bookings" },
  { title: "Guests", href: "/guests", icon: "guests" },
  { title: "Calendar", href: "/calendar", icon: "calendar" },
  { title: "AI Assistant", href: "/ai", icon: "ai" },
  { title: "Analytics", href: "/analytics", icon: "analytics" },
  { title: "Billing", href: "/billing", icon: "billing" },
  { title: "Settings", href: "/settings", icon: "settings" },
]
