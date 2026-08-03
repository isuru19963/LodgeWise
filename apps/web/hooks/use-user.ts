"use client"

import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth-service"
import { userService } from "@/services/user-service"

export const userQueryKeys = {
  me: ["user", "me"] as const,
  organization: ["user", "organization"] as const,
}

export function useUser() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const userQuery = useQuery({
    queryKey: userQueryKeys.me,
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
  })

  const organizationQuery = useQuery({
    queryKey: userQueryKeys.organization,
    queryFn: () => userService.getOrganization(),
    enabled: isAuthenticated,
  })

  return {
    user: userQuery.data ?? null,
    organization: organizationQuery.data ?? null,
    isLoading: authLoading || userQuery.isLoading || organizationQuery.isLoading,
    isFetching: userQuery.isFetching || organizationQuery.isFetching,
    error: userQuery.error ?? organizationQuery.error ?? null,
    refetch: async () => {
      await Promise.all([userQuery.refetch(), organizationQuery.refetch()])
    },
  }
}
