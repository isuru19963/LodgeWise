"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QueryStateMessage } from "@/features/analytics/components/query-state"
import { useBookingAnalytics } from "@/features/analytics/hooks/use-analytics"

export function BookingChart() {
  const bookingsQuery = useBookingAnalytics()
  const summary = bookingsQuery.data

  const data = summary
    ? [
        { label: "Confirmed", value: summary.confirmed_bookings },
        { label: "Cancelled", value: summary.cancelled_bookings },
        { label: "Completed", value: summary.completed_stays },
      ]
    : []

  const blocked = QueryStateMessage({
    isLoading: bookingsQuery.isLoading,
    isError: bookingsQuery.isError,
    error: bookingsQuery.error,
    isEmpty:
      !bookingsQuery.isLoading &&
      Boolean(summary) &&
      summary!.total_bookings === 0,
    emptyMessage: "No bookings yet.",
    loadingMessage: "Loading bookings…",
  })

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Booking summary</CardTitle>
        <CardDescription>
          From GET /analytics/bookings
          {summary ? ` · ${summary.total_bookings} total` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {blocked ? (
          blocked
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
                allowDecimals={false}
              />
              <Tooltip />
              <Bar dataKey="value" name="Bookings" fill="var(--chart-1)" radius={2} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
