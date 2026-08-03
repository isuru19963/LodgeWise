"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateGuest } from "@/features/guests/hooks/use-guests"
import {
  guestFormSchema,
  IDENTIFICATION_TYPE_LABELS,
  type GuestFormInput,
  type IdentificationType,
} from "@/features/guests/schemas/guest-schema"
import { ApiError } from "@/lib/api-client"

const defaultValues: GuestFormInput = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country: "",
  identification_type: "",
  identification_number: "",
  notes: "",
}

type GuestFormProps = {
  onCreated?: (guestId: string) => void
}

export function GuestForm({ onCreated }: GuestFormProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createGuest = useCreateGuest()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GuestFormInput>({
    resolver: zodResolver(guestFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      setFormError(null)
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const guest = await createGuest.mutateAsync(values)
      onCreated?.(guest.id)
      setOpen(false)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.detail
          : "Could not create guest. Try again."
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add guest</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add guest</DialogTitle>
          <DialogDescription>
            Create a guest profile shared across every property in your
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                aria-invalid={Boolean(errors.first_name)}
                {...register("first_name")}
              />
              {errors.first_name ? (
                <p className="text-xs text-destructive">
                  {errors.first_name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                aria-invalid={Boolean(errors.last_name)}
                {...register("last_name")}
              />
              {errors.last_name ? (
                <p className="text-xs text-destructive">
                  {errors.last_name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+94 77 123 4567"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification_type">Identification type</Label>
              <select
                id="identification_type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                {...register("identification_type")}
              >
                <option value="">Not set</option>
                {(
                  Object.keys(IDENTIFICATION_TYPE_LABELS) as IdentificationType[]
                ).map((type) => (
                  <option key={type} value={type}>
                    {IDENTIFICATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification_number">
                Identification number
              </Label>
              <Input
                id="identification_number"
                {...register("identification_number")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Preferences, allergies, VIP notes…"
                {...register("notes")}
              />
            </div>
          </div>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createGuest.isPending}
            >
              {isSubmitting || createGuest.isPending ? "Saving…" : "Save guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
