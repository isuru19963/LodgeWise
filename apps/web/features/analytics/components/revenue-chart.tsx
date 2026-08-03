"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QueryStateMessage } from "@/features/analytics/components/query-state"
import { useRevenueAnalytics } from "@/features/analytics/hooks/use-analytics"
import {
  formatMoney,
  toNumber,
  type RevenuePeriod,
} from "@/features/analytics/types/analytics-types"

const PERIODS: { value: RevenuePeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

export function RevenueChart() {
  const [period, setPeriod] = useState<RevenuePeriod>("monthly")
  const revenueQuery = useRevenueAnalytics(period)

  const points = useMemo(() => {
    const data = revenueQuery.data
    if (!data) return []

    if (period === "daily") {
      return data.daily_revenue.map((point) => ({
        label: point.label,
        revenue: toNumber(point.revenue),
      }))
    }

    if (period === "monthly") {
      return data.monthly_revenue.map((point) => ({
        label: point.label,
        revenue: toNumber(point.revenue),
      }))
    }

    // Aggregate monthly points into calendar years for the yearly view.
    const byYear = new Map<string, number>()
    for (const point of data.monthly_revenue) {
      const year = point.period_start.slice(0, 4)
      byYear.set(year, (byYear.get(year) ?? 0) + toNumber(point.revenue))
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, revenue]) => ({ label, revenue }))
  }, [revenueQuery.data, period])

  const blocked = QueryStateMessage({
    isLoading: revenueQuery.isLoading,
    isError: revenueQuery.isError,
    error: revenueQuery.error,
    isEmpty: !revenueQuery.isLoading && points.length === 0,
    emptyMessage: "No revenue in this period yet.",
    loadingMessage: "Loading revenue…",
  })

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Revenue</CardTitle>
          <CardDescription>
            From GET /analytics/revenue
            {revenueQuery.data
              ? ` · ${formatMoney(revenueQuery.data.total_revenue)} total`
              : null}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="xs"
              variant={period === item.value ? "default" : "outline"}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {blocked ? (
          blocked
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value: number) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                }
              />
              <Tooltip
                formatter={(value) => [
                  typeof value === "number"
                    ? formatMoney(value)
                    : String(value ?? ""),
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
