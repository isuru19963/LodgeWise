"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { GuestFormInput } from "@/features/guests/schemas/guest-schema"
import { guestService } from "@/features/guests/services/guest-service"
import { useAuth } from "@/hooks/use-auth"

export const guestQueryKeys = {
  all: ["guests"] as const,
  list: (search?: string) => ["guests", "list", search ?? ""] as const,
  detail: (id: string) => ["guests", id] as const,
}

export function useGuests(search?: string) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: guestQueryKeys.list(search),
    queryFn: () => guestService.listGuests(search),
    enabled: isAuthenticated,
  })
}

export function useGuest(guestId: string) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: guestQueryKeys.detail(guestId),
    queryFn: () => guestService.getGuest(guestId),
    enabled: isAuthenticated && Boolean(guestId),
  })
}

export function useCreateGuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GuestFormInput) => guestService.createGuest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: guestQueryKeys.all })
    },
  })
}
