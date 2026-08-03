"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Header } from "@/components/layout/header"
import { PageShell } from "@/components/shared/page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateProperty,
  usePropertyTypes,
} from "@/hooks/use-properties"
import { ApiError } from "@/lib/api-client"
import {
  formatPropertyTypeName,
  propertyDetailsSchema,
  sortPropertyTypes,
  type PropertyDetailsInput,
  type PropertyType,
} from "@/lib/properties"
import { cn } from "@/lib/utils"

type Step = "type" | "details"

export function AddPropertyWizard() {
  const router = useRouter()
  const typesQuery = usePropertyTypes()
  const createProperty = useCreateProperty()

  const [step, setStep] = useState<Step>("type")
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const types = sortPropertyTypes(typesQuery.data ?? [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyDetailsInput>({
    resolver: zodResolver(propertyDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      timezone: "UTC",
      currency: "USD",
      check_in_time: "14:00",
      check_out_time: "11:00",
    },
  })

  const onSave = handleSubmit(async (values) => {
    if (!selectedType) {
      setFormError("Select a property type first.")
      setStep("type")
      return
    }

    setFormError(null)
    try {
      const property = await createProperty.mutateAsync({
        ...values,
        property_type_id: selectedType.id,
      })
      router.push(`/properties/${property.id}/units`)
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.detail)
      } else {
        setFormError("Could not save property. Try again.")
      }
    }
  })

  return (
    <PageShell>
      <Header
        title="Add property"
        description="Select a type, add details, then manage units."
      />

      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <li className={cn(step === "type" && "font-medium text-foreground")}>
          1. Select type
        </li>
        <li aria-hidden>→</li>
        <li className={cn(step === "details" && "font-medium text-foreground")}>
          2. Add details
        </li>
        <li aria-hidden>→</li>
        <li>3. Manage units</li>
      </ol>

      {step === "type" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium tracking-tight">
              Select type
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how this property operates — hotel rooms, whole villas,
              dorm beds, and more.
            </p>
          </div>

          {typesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading types…</p>
          ) : null}

          {typesQuery.isError ? (
            <p className="text-sm text-destructive" role="alert">
              Could not load property types.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => {
              const active = selectedType?.id === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "rounded-lg border px-4 py-4 text-left transition-colors",
                    active
                      ? "border-foreground bg-muted/40"
                      : "border-border hover:border-foreground/40 hover:bg-muted/20"
                  )}
                >
                  <p className="text-sm font-medium tracking-tight">
                    {formatPropertyTypeName(type.name)}
                  </p>
                  {type.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!selectedType}
              onClick={() => setStep("details")}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/properties")}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {step === "details" && selectedType ? (
        <section className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardDescription>Selected type</CardDescription>
              <CardTitle className="text-lg">
                {formatPropertyTypeName(selectedType.name)}
              </CardTitle>
            </CardHeader>
          </Card>

          <form onSubmit={onSave} className="space-y-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Property name</Label>
                <Input
                  id="name"
                  placeholder="Seaside Villa"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Short description (optional)"
                  {...register("description")}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email ? (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" placeholder="UTC" {...register("timezone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  maxLength={3}
                  {...register("currency")}
                />
                {errors.currency ? (
                  <p className="text-xs text-destructive">
                    {errors.currency.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_in_time">Check-in</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  {...register("check_in_time")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out_time">Check-out</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  {...register("check_out_time")}
                />
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting || createProperty.isPending}>
                {isSubmitting || createProperty.isPending
                  ? "Saving…"
                  : "Save property"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("type")}
              >
                Back
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </PageShell>
  )
}
