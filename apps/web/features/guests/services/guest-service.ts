import { apiClient } from "@/lib/api-client"
import {
  emptyToNull,
  guestSchema,
  type Guest,
  type GuestFormInput,
  type IdentificationType,
} from "@/features/guests/schemas/guest-schema"

export const guestService = {
  async listGuests(search?: string): Promise<Guest[]> {
    const query = new URLSearchParams()
    if (search?.trim()) query.set("search", search.trim())
    const qs = query.toString()
    const data = await apiClient<unknown>(`/guests${qs ? `?${qs}` : ""}`)
    return guestSchema.array().parse(data)
  },

  async getGuest(guestId: string): Promise<Guest> {
    const data = await apiClient<unknown>(`/guests/${guestId}`)
    return guestSchema.parse(data)
  },

  async createGuest(input: GuestFormInput): Promise<Guest> {
    const allowed: IdentificationType[] = [
      "passport",
      "national_id",
      "driving_license",
      "other",
    ]
    const rawType = input.identification_type?.trim() || ""
    const identificationType = allowed.includes(rawType as IdentificationType)
      ? (rawType as IdentificationType)
      : null

    const data = await apiClient<unknown>("/guests", {
      method: "POST",
      body: {
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        email: emptyToNull(input.email),
        phone: emptyToNull(input.phone),
        country: emptyToNull(input.country),
        identification_type: identificationType,
        identification_number: emptyToNull(input.identification_number),
        notes: emptyToNull(input.notes),
      },
    })
    return guestSchema.parse(data)
  },
}
