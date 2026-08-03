"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import {
  propertyService,
  type PropertyCreatePayload,
} from "@/services/property-service"

export const propertyQueryKeys = {
  types: ["property-types"] as const,
  list: ["properties"] as const,
  detail: (id: string) => ["properties", id] as const,
}

export function usePropertyTypes() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: propertyQueryKeys.types,
    queryFn: () => propertyService.listPropertyTypes(),
    enabled: isAuthenticated,
  })
}

export function useProperties() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: propertyQueryKeys.list,
    queryFn: () => propertyService.listProperties(),
    enabled: isAuthenticated,
  })
}

export function useProperty(propertyId: string) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: propertyQueryKeys.detail(propertyId),
    queryFn: () => propertyService.getProperty(propertyId),
    enabled: isAuthenticated && Boolean(propertyId),
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PropertyCreatePayload) =>
      propertyService.createProperty(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: propertyQueryKeys.list })
    },
  })
}
