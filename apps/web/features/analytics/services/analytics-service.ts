import { apiClient } from "@/lib/api-client"
import type {
  AnalyticsOverview,
  BookingAnalytics,
  OccupancyAnalytics,
  PropertiesAnalytics,
  RevenueAnalytics,
  RevenueQueryParams,
} from "@/features/analytics/types/analytics-types"

/**
 * Live analytics client. Auth bearer + tenant isolation come from apiClient / JWT.
 */
export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    return apiClient<AnalyticsOverview>("/analytics/overview")
  },

  async getRevenue(params: RevenueQueryParams): Promise<RevenueAnalytics> {
    const query = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
    })
    if (params.property_id) query.set("property_id", params.property_id)
    return apiClient<RevenueAnalytics>(`/analytics/revenue?${query.toString()}`)
  },

  async getOccupancy(params?: {
    property_id?: string
    as_of?: string
  }): Promise<OccupancyAnalytics> {
    const query = new URLSearchParams()
    if (params?.property_id) query.set("property_id", params.property_id)
    if (params?.as_of) query.set("as_of", params.as_of)
    const qs = query.toString()
    return apiClient<OccupancyAnalytics>(
      `/analytics/occupancy${qs ? `?${qs}` : ""}`
    )
  },

  async getBookings(params?: {
    property_id?: string
  }): Promise<BookingAnalytics> {
    const query = new URLSearchParams()
    if (params?.property_id) query.set("property_id", params.property_id)
    const qs = query.toString()
    return apiClient<BookingAnalytics>(
      `/analytics/bookings${qs ? `?${qs}` : ""}`
    )
  },

  async getProperties(): Promise<PropertiesAnalytics> {
    return apiClient<PropertiesAnalytics>("/analytics/properties")
  },
}
