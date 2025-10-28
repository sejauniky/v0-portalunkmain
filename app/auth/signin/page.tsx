"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaGoogle, FaGithub } from "react-icons/fa"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Portal UNK</CardTitle>
          <CardDescription>Faça login para acessar o sistema de gerenciamento de eventos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Continuar com Google
          </Button>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            <FaGithub className="mr-2 h-4 w-4" />
            Continuar com GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
