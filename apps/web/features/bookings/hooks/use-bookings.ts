"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  type BookingFormInput,
  type BookingStatus,
} from "@/features/bookings/schemas/booking-schema"
import { bookingService } from "@/features/bookings/services/booking-service"
import { useAuth } from "@/hooks/use-auth"

export {
  useCreateGuest,
  useGuests,
  guestQueryKeys,
} from "@/features/guests/hooks/use-guests"

export const bookingQueryKeys = {
  all: ["bookings"] as const,
  list: (filters?: {
    property_id?: string
    guest_id?: string
    status?: BookingStatus
  }) => ["bookings", "list", filters ?? {}] as const,
  availability: (params: {
    property_id: string
    start_date: string
    end_date: string
  }) => ["availability", params] as const,
}

export function useBookings(filters?: {
  property_id?: string
  guest_id?: string
  status?: BookingStatus
}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: bookingQueryKeys.list(filters),
    queryFn: () => bookingService.listBookings(filters),
    enabled: isAuthenticated,
  })
}

export function useAvailability(
  params: {
    property_id: string
    start_date: string
    end_date: string
  } | null
) {
  const { isAuthenticated } = useAuth()
  const enabled =
    isAuthenticated &&
    Boolean(params?.property_id && params.start_date && params.end_date) &&
    Boolean(params && params.end_date > params.start_date)

  return useQuery({
    queryKey: params
      ? bookingQueryKeys.availability(params)
      : ["availability", "idle"],
    queryFn: () => {
      if (!params) throw new Error("Missing availability params")
      return bookingService.getAvailability(params)
    },
    enabled,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookingFormInput) =>
      bookingService.createBooking(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["availability"] })
    },
  })
}
