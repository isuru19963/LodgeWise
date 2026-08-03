"use client"

import { useQuery } from "@tanstack/react-query"

import {
  revenueRangeForPeriod,
  type RevenuePeriod,
} from "@/features/analytics/types/analytics-types"
import { analyticsService } from "@/features/analytics/services/analytics-service"
import { useAuth } from "@/hooks/use-auth"

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  overview: ["analytics", "overview"] as const,
  revenue: (params: {
    start_date: string
    end_date: string
    property_id?: string
  }) => ["analytics", "revenue", params] as const,
  occupancy: (params?: { property_id?: string; as_of?: string }) =>
    ["analytics", "occupancy", params ?? {}] as const,
  bookings: (params?: { property_id?: string }) =>
    ["analytics", "bookings", params ?? {}] as const,
  properties: ["analytics", "properties"] as const,
}

export function useAnalyticsOverview() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: analyticsQueryKeys.overview,
    queryFn: () => analyticsService.getOverview(),
    enabled: isAuthenticated,
  })
}

export function useRevenueAnalytics(
  period: RevenuePeriod = "monthly",
  propertyId?: string
) {
  const { isAuthenticated } = useAuth()
  const range = revenueRangeForPeriod(period)
  const params = {
    ...range,
    property_id: propertyId,
  }

  return useQuery({
    queryKey: analyticsQueryKeys.revenue(params),
    queryFn: () => analyticsService.getRevenue(params),
    enabled: isAuthenticated,
  })
}

export function useOccupancyAnalytics(propertyId?: string) {
  const { isAuthenticated } = useAuth()
  const params = propertyId ? { property_id: propertyId } : undefined
  return useQuery({
    queryKey: analyticsQueryKeys.occupancy(params),
    queryFn: () => analyticsService.getOccupancy(params),
    enabled: isAuthenticated,
  })
}

export function useBookingAnalytics(propertyId?: string) {
  const { isAuthenticated } = useAuth()
  const params = propertyId ? { property_id: propertyId } : undefined
  return useQuery({
    queryKey: analyticsQueryKeys.bookings(params),
    queryFn: () => analyticsService.getBookings(params),
    enabled: isAuthenticated,
  })
}

export function usePropertyPerformance() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: analyticsQueryKeys.properties,
    queryFn: () => analyticsService.getProperties(),
    enabled: isAuthenticated,
  })
}
