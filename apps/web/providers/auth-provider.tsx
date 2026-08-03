"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import {
  clearTokens,
  hasSessionCookie,
  type LoginInput,
  type Organization,
  type User,
} from "@/lib/auth"
import { ApiError } from "@/lib/api-client"
import { authService } from "@/services/auth-service"
import { userService } from "@/services/user-service"

type AuthContextValue = {
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput, redirectTo?: string) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    if (!hasSessionCookie()) {
      setUser(null)
      setOrganization(null)
      return
    }

    try {
      const [nextUser, nextOrg] = await Promise.all([
        authService.getCurrentUser(),
        userService.getOrganization(),
      ])
      setUser(nextUser)
      setOrganization(nextOrg)
    } catch (error) {
      clearTokens()
      setUser(null)
      setOrganization(null)
      if (!(error instanceof ApiError && error.status === 401)) {
        // Keep session cleared; caller may surface non-auth errors
        throw error
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        if (hasSessionCookie()) {
          const [nextUser, nextOrg] = await Promise.all([
            authService.getCurrentUser(),
            userService.getOrganization(),
          ])
          if (!cancelled) {
            setUser(nextUser)
            setOrganization(nextOrg)
          }
        }
      } catch {
        if (!cancelled) {
          clearTokens()
          setUser(null)
          setOrganization(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (input: LoginInput, redirectTo = "/overview") => {
      const result = await authService.login(input)
      setUser(result.user)
      try {
        const org = await userService.getOrganization()
        setOrganization(org)
      } catch {
        setOrganization(null)
      }
      const safe =
        redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/overview"
      router.replace(safe)
      router.refresh()
    },
    [router]
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setOrganization(null)
    router.replace("/login")
    router.refresh()
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, organization, isLoading, login, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return ctx
}
