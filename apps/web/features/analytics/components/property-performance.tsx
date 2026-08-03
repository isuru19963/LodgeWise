"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QueryStateMessage } from "@/features/analytics/components/query-state"
import { usePropertyPerformance } from "@/features/analytics/hooks/use-analytics"
import {
  formatMoney,
  toNumber,
} from "@/features/analytics/types/analytics-types"

export function PropertyPerformance() {
  const performanceQuery = usePropertyPerformance()
  const rows = performanceQuery.data?.properties ?? []

  const blocked = QueryStateMessage({
    isLoading: performanceQuery.isLoading,
    isError: performanceQuery.isError,
    error: performanceQuery.error,
    isEmpty: !performanceQuery.isLoading && rows.length === 0,
    emptyMessage: "No properties yet.",
    loadingMessage: "Loading properties…",
  })

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Property performance</CardTitle>
        <CardDescription>
          From GET /analytics/properties
          {performanceQuery.data
            ? ` · as of ${performanceQuery.data.as_of_date}`
            : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blocked ? (
          blocked
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.property_id}>
                    <TableCell className="font-medium">
                      {row.property_name}
                    </TableCell>
                    <TableCell>{formatMoney(row.revenue)}</TableCell>
                    <TableCell>
                      {toNumber(row.occupancy_rate).toFixed(1)}%
                    </TableCell>
                    <TableCell>{row.bookings_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
