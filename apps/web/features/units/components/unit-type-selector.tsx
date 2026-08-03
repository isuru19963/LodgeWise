"use client"

import { UNIT_TYPE_PRESETS, type UnitType } from "@/features/units/schemas/unit-schema"
import { cn } from "@/lib/utils"

type UnitTypeSelectorProps = {
  unitTypes: UnitType[]
  value: string
  selectedTypeId?: string
  onChange: (next: {
    unit_type_name: string
    unit_type_id: string
    max_adults?: number
    max_children?: number
    base_price?: number
  }) => void
}

export function UnitTypeSelector({
  unitTypes,
  value,
  selectedTypeId,
  onChange,
}: UnitTypeSelectorProps) {
  const existingNames = new Set(unitTypes.map((t) => t.name.toLowerCase()))

  const options = [
    ...unitTypes.map((t) => ({
      key: t.id,
      label: t.name,
      typeId: t.id,
      max_adults: t.max_adults,
      max_children: t.max_children,
      base_price: Number(t.base_price),
      kind: "existing" as const,
    })),
    ...UNIT_TYPE_PRESETS.filter(
      (name) => !existingNames.has(name.toLowerCase())
    ).map((name) => ({
      key: `preset:${name}`,
      label: name,
      typeId: "",
      max_adults: undefined,
      max_children: undefined,
      base_price: undefined,
      kind: "preset" as const,
    })),
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active =
            (option.typeId && option.typeId === selectedTypeId) ||
            (!option.typeId &&
              value.toLowerCase() === option.label.toLowerCase())

          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                onChange({
                  unit_type_name: option.label,
                  unit_type_id: option.typeId,
                  max_adults: option.max_adults,
                  max_children: option.max_children,
                  base_price: option.base_price,
                })
              }
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                active
                  ? "border-foreground bg-muted font-medium text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {option.label}
              {option.kind === "existing" ? null : (
                <span className="ml-1 text-[10px] uppercase tracking-wide opacity-60">
                  new
                </span>
              )}
            </button>
          )
        })}
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange({
            unit_type_name: event.target.value,
            unit_type_id: "",
          })
        }
        placeholder="Or type a custom unit type"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Unit type name"
      />
    </div>
  )
}
