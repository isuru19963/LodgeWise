import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
            Access your Lodgwise AI workspace. Authentication is not wired yet —
            this is a layout preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@property.com"
              autoComplete="email"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button className="w-full sm:w-auto" disabled>
            Continue
          </Button>
          <Button variant="ghost" className="w-full sm:w-auto" asChild>
            <Link href="/overview">Skip to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
