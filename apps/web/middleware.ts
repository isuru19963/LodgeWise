import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_COOKIE } from "@/lib/auth-cookies"

const PROTECTED_PREFIXES = [
  "/overview",
  "/properties",
  "/bookings",
  "/guests",
  "/calendar",
  "/ai",
  "/analytics",
  "/billing",
  "/settings",
] as const

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function hasSession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(AUTH_COOKIE.access)?.value ||
      request.cookies.get(AUTH_COOKIE.refresh)?.value
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = hasSession(request)

  if (isProtectedPath(pathname) && !authenticated) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/login" && authenticated) {
    const overviewUrl = request.nextUrl.clone()
    overviewUrl.pathname = "/overview"
    overviewUrl.search = ""
    return NextResponse.redirect(overviewUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/properties/:path*",
    "/bookings/:path*",
    "/guests/:path*",
    "/calendar/:path*",
    "/ai/:path*",
    "/analytics/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/login",
  ],
}
