import { sql } from "@/lib/neon"

export const validateContractForSignature = async (
  contractId: string,
): Promise<{
  canSign: boolean
  error?: string
}> => {
  try {
    const result = await sql`
      SELECT id, signature_status, contract_content, event_id, dj_id, producer_id
      FROM contract_instances
      WHERE id = ${contractId}
      LIMIT 1
    `

    const contract = result[0]

    if (!contract) {
      return { canSign: false, error: "Contrato não encontrado." }
    }

    if (contract.signature_status === "signed") {
      return { canSign: false, error: "Contrato já foi assinado." }
    }

    if (!contract.contract_content || contract.contract_content.trim() === "") {
      return {
        canSign: false,
        error: "Contrato não disponível para assinatura no momento. Aguarde a geração e tente novamente.",
      }
    }

    return { canSign: true }
  } catch (error) {
    console.error("Erro ao validar contrato:", error)
    return { canSign: false, error: "Erro interno ao validar contrato." }
  }
}
