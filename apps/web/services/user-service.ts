import { apiClient } from "@/lib/api-client"
import { organizationSchema, type Organization } from "@/lib/auth"

export const userService = {
  async getOrganization(): Promise<Organization> {
    const data = await apiClient<unknown>("/organization", { method: "GET" })
    return organizationSchema.parse(data)
  },
}
