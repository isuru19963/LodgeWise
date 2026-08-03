import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  tokenPairSchema,
  type TokenPair,
} from "@/lib/auth"

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Skip Authorization header (login / refresh). */
  skipAuth?: boolean
  /** Internal: avoid infinite refresh loops. */
  _retried?: boolean
}

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set")
  }
  return base.replace(/\/$/, "")
}

async function parseError(response: Response): Promise<ApiError> {
  let detail = response.statusText || "Request failed"
  try {
    const data: unknown = await response.json()
    if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
    ) {
      detail = (data as { detail: string }).detail
    } else if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      Array.isArray((data as { detail: unknown }).detail)
    ) {
      // FastAPI validation errors
      detail = "Validation failed"
    }
  } catch {
    // ignore JSON parse errors
  }
  return new ApiError(response.status, detail)
}

let refreshPromise: Promise<TokenPair | null> | null = null

/**
 * Exchange refresh token for a new pair. Shared promise so concurrent
 * 401s only trigger one refresh. Returns null if refresh is impossible.
 */
async function refreshAccessToken(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!response.ok) {
          clearTokens()
          return null
        }
        const json: unknown = await response.json()
        const tokens = tokenPairSchema.parse(json)
        setTokens(tokens)
        return tokens
      } catch {
        clearTokens()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth, _retried, headers: initHeaders, ...init } = options
  const headers = new Headers(initHeaders)
  headers.set("Accept", "application/json")

  if (body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (!skipAuth) {
    const access = getAccessToken()
    if (access) {
      headers.set("Authorization", `Bearer ${access}`)
    }
  }

  const response = await fetch(`${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !skipAuth && !_retried) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiClient<T>(path, { ...options, _retried: true })
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
