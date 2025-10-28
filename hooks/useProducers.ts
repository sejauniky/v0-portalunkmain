import type { UseQueryResult } from "@tanstack/react-query"
import { useNeonData } from "./useNeonData"
import { producerService } from "@/services/neonService"

type ProducerRecord = {
  id: string
  name?: string
  company_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  profile_id?: string
  created_at?: string
  updated_at?: string
  profile?: {
    id: string
    full_name?: string
    email?: string
    role?: string
  } | null
} & Record<string, unknown>

type UseProducersResult = {
  producers: ProducerRecord[]
  loading: boolean
  error: unknown
  refetch: UseQueryResult<ProducerRecord[]>["refetch"]
}

export function useProducers(): UseProducersResult {
  const { data, loading, error, refetch } = useNeonData<ProducerRecord[]>(producerService, "getAll", [], [])

  return {
    producers: Array.isArray(data) ? data : [],
    loading,
    error,
    refetch,
  }
}
