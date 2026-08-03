import { apiClient } from "@/lib/api-client"
import {
  availabilityResponseSchema,
  bookingSchema,
  type AvailabilityResponse,
  type Booking,
  type BookingFormInput,
  type BookingStatus,
} from "@/features/bookings/schemas/booking-schema"

export type ListBookingsParams = {
  property_id?: string
  guest_id?: string
  status?: BookingStatus
}

export const bookingService = {
  async listBookings(params: ListBookingsParams = {}): Promise<Booking[]> {
    const query = new URLSearchParams()
    if (params.property_id) query.set("property_id", params.property_id)
    if (params.guest_id) query.set("guest_id", params.guest_id)
    if (params.status) query.set("status", params.status)
    const qs = query.toString()
    const data = await apiClient<unknown>(`/bookings${qs ? `?${qs}` : ""}`)
    return bookingSchema.array().parse(data)
  },

  async createBooking(input: BookingFormInput): Promise<Booking> {
    const price = input.unit_price ?? 0
    const data = await apiClient<unknown>("/bookings", {
      method: "POST",
      body: {
        property_id: input.property_id,
        guest_id: input.guest_id,
        check_in_date: input.check_in_date,
        check_out_date: input.check_out_date,
        adults: input.adults,
        children: input.children,
        status: "pending",
        items: [
          {
            unit_id: input.unit_id,
            price,
            quantity: 1,
          },
        ],
      },
    })
    return bookingSchema.parse(data)
  },

  async getAvailability(params: {
    property_id: string
    start_date: string
    end_date: string
    unit_type_id?: string
  }): Promise<AvailabilityResponse> {
    const query = new URLSearchParams({
      property_id: params.property_id,
      start_date: params.start_date,
      end_date: params.end_date,
    })
    if (params.unit_type_id) query.set("unit_type_id", params.unit_type_id)
    const data = await apiClient<unknown>(`/availability?${query.toString()}`)
    return availabilityResponseSchema.parse(data)
  },
}
