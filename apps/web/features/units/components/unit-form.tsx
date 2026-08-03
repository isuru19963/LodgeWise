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
import { UnitTypeSelector } from "@/features/units/components/unit-type-selector"
import { useCreateUnit, useUnitTypes } from "@/features/units/hooks/use-units"
import {
  createUnitFormSchema,
  UNIT_NAME_EXAMPLES,
  type CreateUnitFormInput,
} from "@/features/units/schemas/unit-schema"
import { ApiError } from "@/lib/api-client"

type UnitFormProps = {
  propertyId: string
}

const defaultValues: CreateUnitFormInput = {
  name: "",
  code: "",
  unit_type_id: "",
  unit_type_name: "",
  max_adults: 2,
  max_children: 0,
  base_price: 100,
  status: "available",
}

export function UnitForm({ propertyId }: UnitFormProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const unitTypesQuery = useUnitTypes(propertyId)
  const createUnit = useCreateUnit(propertyId)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUnitFormInput>({
    resolver: zodResolver(createUnitFormSchema),
    defaultValues,
  })

  const unitTypeName = watch("unit_type_name")
  const unitTypeId = watch("unit_type_id")

  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      setFormError(null)
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createUnit.mutateAsync(values)
      setOpen(false)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.detail
          : "Could not create unit. Try again."
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add unit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add unit</DialogTitle>
          <DialogDescription>
            Examples: {UNIT_NAME_EXAMPLES.join(", ")}. Capacity and base price
            belong to the unit type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="unit-name">Name</Label>
              <Input
                id="unit-name"
                placeholder="Room 101"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="unit-code">Code</Label>
              <Input
                id="unit-code"
                placeholder="R101"
                aria-invalid={Boolean(errors.code)}
                {...register("code")}
              />
              {errors.code ? (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Unit type</Label>
              <UnitTypeSelector
                unitTypes={unitTypesQuery.data ?? []}
                value={unitTypeName}
                selectedTypeId={unitTypeId || undefined}
                onChange={(next) => {
                  setValue("unit_type_name", next.unit_type_name, {
                    shouldValidate: true,
                  })
                  setValue("unit_type_id", next.unit_type_id, {
                    shouldValidate: true,
                  })
                  if (next.max_adults !== undefined) {
                    setValue("max_adults", next.max_adults, {
                      shouldValidate: true,
                    })
                  }
                  if (next.max_children !== undefined) {
                    setValue("max_children", next.max_children, {
                      shouldValidate: true,
                    })
                  }
                  if (next.base_price !== undefined) {
                    setValue("base_price", next.base_price, {
                      shouldValidate: true,
                    })
                  }
                }}
              />
              {errors.unit_type_name ? (
                <p className="text-xs text-destructive">
                  {errors.unit_type_name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-adults">Maximum adults</Label>
              <Input
                id="max-adults"
                type="number"
                min={1}
                aria-invalid={Boolean(errors.max_adults)}
                {...register("max_adults", { valueAsNumber: true })}
              />
              {errors.max_adults ? (
                <p className="text-xs text-destructive">
                  {errors.max_adults.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-children">Maximum children</Label>
              <Input
                id="max-children"
                type="number"
                min={0}
                aria-invalid={Boolean(errors.max_children)}
                {...register("max_children", { valueAsNumber: true })}
              />
              {errors.max_children ? (
                <p className="text-xs text-destructive">
                  {errors.max_children.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-price">Base price</Label>
              <Input
                id="base-price"
                type="number"
                min={0.01}
                step="0.01"
                aria-invalid={Boolean(errors.base_price)}
                {...register("base_price", { valueAsNumber: true })}
              />
              {errors.base_price ? (
                <p className="text-xs text-destructive">
                  {errors.base_price.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                {...register("status")}
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of service</option>
              </select>
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
              disabled={isSubmitting || createUnit.isPending}
            >
              {isSubmitting || createUnit.isPending ? "Saving…" : "Save unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
