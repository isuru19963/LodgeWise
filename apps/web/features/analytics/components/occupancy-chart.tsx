"use client"

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QueryStateMessage } from "@/features/analytics/components/query-state"
import { useOccupancyAnalytics } from "@/features/analytics/hooks/use-analytics"

const COLORS = {
  available: "var(--chart-2)",
  occupied: "var(--chart-1)",
  maintenance: "var(--chart-4)",
}

export function OccupancyChart() {
  const occupancyQuery = useOccupancyAnalytics()
  const snapshot = occupancyQuery.data

  const data = snapshot
    ? [
        {
          name: "Available",
          key: "available" as const,
          value: snapshot.available_units,
        },
        {
          name: "Occupied",
          key: "occupied" as const,
          value: snapshot.occupied_units,
        },
        {
          name: "Maintenance",
          key: "maintenance" as const,
          value: snapshot.maintenance_units,
        },
      ]
    : []

  const total = data.reduce((sum, row) => sum + row.value, 0)
  const blocked = QueryStateMessage({
    isLoading: occupancyQuery.isLoading,
    isError: occupancyQuery.isError,
    error: occupancyQuery.error,
    isEmpty: !occupancyQuery.isLoading && total === 0,
    emptyMessage: "No units to show occupancy for.",
    loadingMessage: "Loading occupancy…",
  })

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Occupancy mix</CardTitle>
        <CardDescription>
          From GET /analytics/occupancy
          {snapshot
            ? ` · ${snapshot.occupancy_rate.toFixed(1)}% occupied as of ${snapshot.as_of_date}`
            : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {blocked ? (
          blocked
        ) : (
          <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-56 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.key} fill={COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">
              {data.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-center justify-between gap-6"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 rounded-sm"
                      style={{ background: COLORS[entry.key] }}
                    />
                    {entry.name}
                  </span>
                  <span className="font-medium">{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
