import { apiClient } from "@/lib/api-client"
import {
  authResponseSchema,
  clearTokens,
  setTokens,
  userSchema,
  type AuthResponse,
  type LoginInput,
  type User,
} from "@/lib/auth"

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const data = await apiClient<unknown>("/auth/login", {
      method: "POST",
      body: input,
      skipAuth: true,
    })
    const parsed = authResponseSchema.parse(data)
    setTokens(parsed.tokens)
    return parsed
  },

  /**
   * No server logout endpoint yet — clear client session only.
   * Refresh tokens become unusable once discarded client-side.
   */
  logout(): void {
    clearTokens()
  },

  async getCurrentUser(): Promise<User> {
    const data = await apiClient<unknown>("/users/me", { method: "GET" })
    return userSchema.parse(data)
  },
}
