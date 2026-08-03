import { z } from "zod"

import { AUTH_COOKIE } from "@/lib/auth-cookies"

export { AUTH_COOKIE }

const userRoleSchema = z.enum(["owner", "admin", "manager", "staff"])

export const userSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const tokenPairSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
})

export const authResponseSchema = z.object({
  user: userSchema,
  tokens: tokenPairSchema,
})

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export type User = z.infer<typeof userSchema>
export type Organization = z.infer<typeof organizationSchema>
export type TokenPair = z.infer<typeof tokenPairSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UserRole = z.infer<typeof userRoleSchema>

function isBrowser() {
  return typeof document !== "undefined"
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1)) || null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (!isBrowser()) return
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function clearCookie(name: string) {
  if (!isBrowser()) return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

/** Access token lifetime fallback (matches API default ~15m). */
const ACCESS_MAX_AGE = 60 * 15
/** Refresh token lifetime fallback (matches API default ~14d). */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 14

export function getAccessToken(): string | null {
  return readCookie(AUTH_COOKIE.access)
}

export function getRefreshToken(): string | null {
  return readCookie(AUTH_COOKIE.refresh)
}

export function hasSessionCookie(): boolean {
  return Boolean(getAccessToken() || getRefreshToken())
}

export function setTokens(tokens: TokenPair) {
  writeCookie(
    AUTH_COOKIE.access,
    tokens.access_token,
    tokens.expires_in || ACCESS_MAX_AGE
  )
  writeCookie(AUTH_COOKIE.refresh, tokens.refresh_token, REFRESH_MAX_AGE)
}

export function clearTokens() {
  clearCookie(AUTH_COOKIE.access)
  clearCookie(AUTH_COOKIE.refresh)
}
