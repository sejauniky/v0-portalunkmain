"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

const PaymentReviews = () => {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payments/pending")
      const data = await response.json()

      if (data.warning) {
        console.warn(data.warning)
        toast({ title: "Aviso", description: "Banco de dados não está configurado. Conecte ao Neon para ver os dados.", variant: "default" })
        setPending([])
        return
      }

      if (!response.ok) {
        throw new Error(data.details || "Failed to load pending payments")
      }

      setPending(data.payments ?? [])
    } catch (err) {
      console.error("Failed to load pending payments", err)
      toast({ title: "Erro", description: "Não foi possível carregar comprovantes pendentes", variant: "destructive" })
      setPending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const review = async (eventId, action) => {
    if (action === "reject") {
      const reason = prompt("Motivo da rejeição (visível ao produtor):")
      if (!reason) return
      try {
        const response = await fetch("/api/payments/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, action: "reject", reason }),
        })

        if (!response.ok) {
          throw new Error("Failed to reject payment")
        }

        toast({ title: "Rejeitado", description: "Comprovante rejeitado e produtor notificado." })
        await load()
      } catch (err) {
        console.error("Review reject failed", err)
        toast({ title: "Erro", description: "Não foi possível rejeitar o comprovante", variant: "destructive" })
      }
      return
    }

    // accept
    try {
      const response = await fetch("/api/payments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "accept" }),
      })

      if (!response.ok) {
        throw new Error("Failed to accept payment")
      }

      toast({ title: "Pago", description: "Pagamento confirmado e evento marcado como pago." })
      await load()
    } catch (err) {
      console.error("Review accept failed", err)
      toast({ title: "Erro", description: "Não foi possível confirmar o pagamento", variant: "destructive" })
    }
  }

  if (loading) return <div>Carregando comprovantes...</div>

  if (!pending || pending.length === 0) return <div>Nenhum comprovante pendente para revisão.</div>

  return (
    <div className="space-y-3">
      {pending.map((ev) => (
        <div key={ev.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-semibold">{ev.title}</div>
            <div className="text-xs text-muted-foreground">{ev.event_date}</div>
            {ev.payment_proof && (
              <a href={ev.payment_proof} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">
                Visualizar comprovante
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-green-600 text-white" onClick={() => review(ev.id, "accept")}>
              Confirmar pagamento
            </Button>
            <Button size="sm" variant="destructive" onClick={() => review(ev.id, "reject")}>
              Rejeitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PaymentReviews
