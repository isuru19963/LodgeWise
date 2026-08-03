"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
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
import {
  useAvailability,
  useCreateBooking,
  useCreateGuest,
  useGuests,
} from "@/features/bookings/hooks/use-bookings"
import {
  bookingFormSchema,
  formatMoney,
  guestDisplayName,
  type BookingFormInput,
} from "@/features/bookings/schemas/booking-schema"
import { useProperties } from "@/hooks/use-properties"
import { ApiError } from "@/lib/api-client"

type BookingFormProps = {
  defaultPropertyId?: string
}

export function BookingForm({ defaultPropertyId }: BookingFormProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [newGuestMode, setNewGuestMode] = useState(false)
  const [guestFirst, setGuestFirst] = useState("")
  const [guestLast, setGuestLast] = useState("")

  const propertiesQuery = useProperties()
  const guestsQuery = useGuests()
  const createBooking = useCreateBooking()
  const createGuest = useCreateGuest()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guest_id: "",
      property_id: defaultPropertyId ?? "",
      unit_id: "",
      check_in_date: "",
      check_out_date: "",
      adults: 1,
      children: 0,
      notes: "",
      unit_price: 0,
    },
  })

  const propertyId = watch("property_id")
  const checkIn = watch("check_in_date")
  const checkOut = watch("check_out_date")
  const unitId = watch("unit_id")

  const availabilityParams = useMemo(() => {
    if (!propertyId || !checkIn || !checkOut || checkOut <= checkIn) return null
    return {
      property_id: propertyId,
      start_date: checkIn,
      end_date: checkOut,
    }
  }, [propertyId, checkIn, checkOut])

  const availabilityQuery = useAvailability(availabilityParams)
  const availableUnits = availabilityQuery.data?.units ?? []

  useEffect(() => {
    if (!open) {
      reset({
        guest_id: "",
        property_id: defaultPropertyId ?? "",
        unit_id: "",
        check_in_date: "",
        check_out_date: "",
        adults: 1,
        children: 0,
        notes: "",
        unit_price: 0,
      })
      setFormError(null)
      setNewGuestMode(false)
      setGuestFirst("")
      setGuestLast("")
    }
  }, [open, reset, defaultPropertyId])

  useEffect(() => {
    const selected = availableUnits.find((u) => u.unit_id === unitId)
    if (selected) {
      setValue("unit_price", Number(selected.total_price), {
        shouldValidate: true,
      })
    }
  }, [unitId, availableUnits, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      let guestId = values.guest_id

      if (newGuestMode) {
        if (!guestFirst.trim() || !guestLast.trim()) {
          setFormError("Enter guest first and last name.")
          return
        }
        const guest = await createGuest.mutateAsync({
          first_name: guestFirst,
          last_name: guestLast,
          email: "",
          phone: "",
          country: "",
          identification_type: "",
          identification_number: "",
          notes: values.notes || "",
        })
        guestId = guest.id
      } else if (!guestId) {
        setFormError("Select a guest.")
        return
      }

      const selected = availableUnits.find((u) => u.unit_id === values.unit_id)
      await createBooking.mutateAsync({
        ...values,
        guest_id: guestId,
        unit_price: selected
          ? Number(selected.total_price)
          : values.unit_price ?? 0,
      })
      setOpen(false)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.detail
          : "Could not create booking. Try again."
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Create booking</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create booking</DialogTitle>
          <DialogDescription>
            Select guest, property, stay dates, and an available unit. Price
            comes from availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Guest</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setNewGuestMode((v) => !v)}
              >
                {newGuestMode ? "Select existing" : "New guest"}
              </Button>
            </div>
            {newGuestMode ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="First name"
                  value={guestFirst}
                  onChange={(e) => setGuestFirst(e.target.value)}
                />
                <Input
                  placeholder="Last name"
                  value={guestLast}
                  onChange={(e) => setGuestLast(e.target.value)}
                />
              </div>
            ) : (
              <>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register("guest_id")}
                >
                  <option value="">Select guest</option>
                  {(guestsQuery.data ?? []).map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guestDisplayName(guest)}
                    </option>
                  ))}
                </select>
                {errors.guest_id ? (
                  <p className="text-xs text-destructive">
                    {errors.guest_id.message}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_id">Property</Label>
            <select
              id="property_id"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              {...register("property_id", {
                onChange: () => {
                  setValue("unit_id", "")
                },
              })}
            >
              <option value="">Select property</option>
              {(propertiesQuery.data ?? []).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {errors.property_id ? (
              <p className="text-xs text-destructive">
                {errors.property_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="check_in_date">Check-in</Label>
              <Input
                id="check_in_date"
                type="date"
                {...register("check_in_date", {
                  onChange: () => setValue("unit_id", ""),
                })}
              />
              {errors.check_in_date ? (
                <p className="text-xs text-destructive">
                  {errors.check_in_date.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_date">Check-out</Label>
              <Input
                id="check_out_date"
                type="date"
                {...register("check_out_date", {
                  onChange: () => setValue("unit_id", ""),
                })}
              />
              {errors.check_out_date ? (
                <p className="text-xs text-destructive">
                  {errors.check_out_date.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_id">Unit</Label>
            <select
              id="unit_id"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              disabled={!availabilityParams || availabilityQuery.isLoading}
              {...register("unit_id")}
            >
              <option value="">
                {!availabilityParams
                  ? "Pick property and dates first"
                  : availabilityQuery.isLoading
                    ? "Checking availability…"
                    : availableUnits.length === 0
                      ? "No units available"
                      : "Select unit"}
              </option>
              {availableUnits.map((unit) => (
                <option key={unit.unit_id} value={unit.unit_id}>
                  {unit.name} ({unit.code}) · {formatMoney(unit.total_price)}
                </option>
              ))}
            </select>
            {errors.unit_id ? (
              <p className="text-xs text-destructive">{errors.unit_id.message}</p>
            ) : null}
            {availabilityQuery.isError ? (
              <p className="text-xs text-destructive">
                Could not load availability for these dates.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min={1}
                {...register("adults", { valueAsNumber: true })}
              />
              {errors.adults ? (
                <p className="text-xs text-destructive">
                  {errors.adults.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min={0}
                {...register("children", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes (saved with new guests)"
              {...register("notes")}
            />
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
              disabled={
                isSubmitting || createBooking.isPending || createGuest.isPending
              }
            >
              {isSubmitting || createBooking.isPending
                ? "Saving…"
                : "Save booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
