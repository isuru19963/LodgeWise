/** Types aligned with GET /api/v1/analytics/* responses. */

export type Money = string | number

export type AnalyticsOverview = {
  total_properties: number
  total_units: number
  active_bookings: number
  occupancy_rate: number
  total_revenue: Money
}

export type RevenuePoint = {
  label: string
  period_start: string
  revenue: Money
}

export type PropertyRevenue = {
  property_id: string
  property_name: string
  revenue: Money
}

export type RevenueAnalytics = {
  start_date: string
  end_date: string
  property_id: string | null
  daily_revenue: RevenuePoint[]
  monthly_revenue: RevenuePoint[]
  revenue_by_property: PropertyRevenue[]
  total_revenue: Money
}

export type OccupancyAnalytics = {
  occupancy_rate: number
  available_units: number
  occupied_units: number
  maintenance_units: number
  as_of_date: string
  property_id: string | null
}

export type BookingAnalytics = {
  total_bookings: number
  confirmed_bookings: number
  cancelled_bookings: number
  completed_stays: number
}

export type PropertyPerformanceRow = {
  property_id: string
  property_name: string
  bookings_count: number
  revenue: Money
  occupancy_rate: number
}

export type PropertiesAnalytics = {
  properties: PropertyPerformanceRow[]
  as_of_date: string
}

export type RevenuePeriod = "daily" | "monthly" | "yearly"

export type RevenueQueryParams = {
  start_date: string
  end_date: string
  property_id?: string
}

export function toNumber(value: Money | undefined | null): number {
  if (value == null) return 0
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(value: Money, currency = "USD"): string {
  return toNumber(value).toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Date ranges for revenue chart period toggles. */
export function revenueRangeForPeriod(period: RevenuePeriod): {
  start_date: string
  end_date: string
} {
  const end = new Date()
  const start = new Date(end)
  if (period === "daily") {
    start.setDate(end.getDate() - 29)
  } else if (period === "monthly") {
    start.setMonth(end.getMonth() - 11)
    start.setDate(1)
  } else {
    start.setFullYear(end.getFullYear() - 4)
    start.setMonth(0)
    start.setDate(1)
  }
  return { start_date: toIsoDate(start), end_date: toIsoDate(end) }
}
