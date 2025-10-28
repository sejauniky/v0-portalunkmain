"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-destructive">Erro de Autenticação</CardTitle>
          <CardDescription>
            {error === "Configuration" && "Erro de configuração do servidor."}
            {error === "AccessDenied" && "Acesso negado."}
            {error === "Verification" && "Token de verificação inválido."}
            {!error && "Ocorreu um erro durante a autenticação."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Tentar novamente</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
