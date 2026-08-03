"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import type { CreateUnitFormInput } from "@/features/units/schemas/unit-schema"
import { unitService } from "@/features/units/services/unit-service"

export const unitQueryKeys = {
  all: (propertyId: string) => ["units", propertyId] as const,
  types: (propertyId: string) => ["unit-types", propertyId] as const,
}

export function useUnits(propertyId: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: unitQueryKeys.all(propertyId),
    queryFn: () => unitService.listUnits(propertyId),
    enabled: isAuthenticated && Boolean(propertyId),
  })
}

export function useUnitTypes(propertyId: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: unitQueryKeys.types(propertyId),
    queryFn: () => unitService.listUnitTypes(propertyId),
    enabled: isAuthenticated && Boolean(propertyId),
  })
}

export function useCreateUnit(propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUnitFormInput) =>
      unitService.createUnitWithType(propertyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: unitQueryKeys.all(propertyId),
      })
      void queryClient.invalidateQueries({
        queryKey: unitQueryKeys.types(propertyId),
      })
    },
  })
}
