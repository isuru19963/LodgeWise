/** Cookie keys — shared by client auth helpers and Edge middleware. */
export const AUTH_COOKIE = {
  access: "lw_access_token",
  refresh: "lw_refresh_token",
} as const
