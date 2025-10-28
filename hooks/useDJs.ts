import type { UseQueryResult } from "@tanstack/react-query"
import { useNeonData } from "./useNeonData"
import { djServiceWrapper } from "@/services/neonService"

type DjRecord = {
  id: string
  artist_name: string
  real_name?: string | null
  email?: string | null
  avatar_url?: string | null
  genre?: string | null
  base_price?: number | null
  status?: string | null
  instagram_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  soundcloud_url?: string | null
  birth_date?: string | null
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
} & Record<string, unknown>

type UseDJsResult = {
  djs: DjRecord[]
  loading: boolean
  error: unknown
  refetch: UseQueryResult<DjRecord[]>["refetch"]
}

export function useDJs(): UseDJsResult {
  const { data, loading, error, refetch } = useNeonData<DjRecord[]>(djServiceWrapper, "getAll", [], [])

  return {
    djs: Array.isArray(data) ? data : [],
    loading,
    error,
    refetch,
  }
}
