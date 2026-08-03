"use client"

import { Header } from "@/components/layout/header"
import { EmptyState, PageShell } from "@/components/shared/page"
import { BookingChart } from "@/features/analytics/components/booking-chart"
import { OccupancyChart } from "@/features/analytics/components/occupancy-chart"
import { PropertyPerformance } from "@/features/analytics/components/property-performance"
import { QueryStateMessage } from "@/features/analytics/components/query-state"
import { RevenueChart } from "@/features/analytics/components/revenue-chart"
import { StatsCard } from "@/features/analytics/components/stats-card"
import { useAnalyticsOverview } from "@/features/analytics/hooks/use-analytics"
import { formatMoney } from "@/features/analytics/types/analytics-types"

export function AnalyticsPageContent() {
  const overviewQuery = useAnalyticsOverview()
  const overview = overviewQuery.data

  const overviewBlocked =
    overviewQuery.isLoading || overviewQuery.isError
      ? QueryStateMessage({
          isLoading: overviewQuery.isLoading,
          isError: overviewQuery.isError,
          error: overviewQuery.error,
          loadingMessage: "Loading overview…",
        })
      : null

  return (
    <PageShell>
      <Header
        title="Analytics"
        description="Live occupancy, revenue, and booking performance for your organization."
      />

      {overviewBlocked ? (
        <div className="rounded-lg border border-border px-4 py-6">
          {overviewBlocked}
        </div>
      ) : overview &&
        overview.total_properties === 0 &&
        overview.total_units === 0 &&
        overview.active_bookings === 0 ? (
        <EmptyState
          title="No analytics yet"
          description="Add properties, units, and bookings to populate this dashboard."
          actionLabel="Add property"
          actionHref="/properties/new"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatsCard
            label="Total properties"
            value={String(overview?.total_properties ?? 0)}
          />
          <StatsCard
            label="Total units"
            value={String(overview?.total_units ?? 0)}
          />
          <StatsCard
            label="Occupancy rate"
            value={`${(overview?.occupancy_rate ?? 0).toFixed(1)}%`}
          />
          <StatsCard
            label="Total revenue"
            value={formatMoney(overview?.total_revenue ?? 0)}
          />
          <StatsCard
            label="Active bookings"
            value={String(overview?.active_bookings ?? 0)}
            hint="Pending, confirmed, checked in"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueChart />
        <BookingChart />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <OccupancyChart />
        <PropertyPerformance />
      </div>
    </PageShell>
  )
}
