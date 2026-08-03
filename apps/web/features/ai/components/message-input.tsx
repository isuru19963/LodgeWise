"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Enter a message")
    .max(4000, "Message is too long"),
})

type MessageInputValues = z.infer<typeof messageSchema>

type MessageInputProps = {
  onSend: (message: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = "Ask about check-in, amenities, policies…",
}: MessageInputProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageInputValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    await onSend(values.message)
    reset({ message: "" })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <Input
          aria-invalid={Boolean(errors.message)}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          autoComplete="off"
          {...register("message")}
        />
        <Button type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Sending…" : "Send"}
        </Button>
      </div>
      {errors.message ? (
        <p className="text-xs text-destructive">{errors.message.message}</p>
      ) : null}
    </form>
  )
}
