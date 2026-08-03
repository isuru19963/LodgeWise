import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
          <CardDescription>
            Access your Lodgwise AI workspace with your organization email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
