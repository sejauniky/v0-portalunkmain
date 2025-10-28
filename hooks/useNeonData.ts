"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

type UseNeonDataReturn<TResult> = {
  data: TResult | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useNeonData<TResult = any, TArgs extends any[] = any[]>(
  service: any,
  methodName: string,
  args: TArgs = [] as any,
  deps: any[] = [],
): UseNeonDataReturn<TResult> {
  const queryClient = useQueryClient()

  const queryKey = [
    "neon",
    service?.__serviceName ?? "service",
    methodName,
    ...(deps ?? []),
    ...(args as unknown as unknown[]),
  ]

  const {
    data,
    error,
    isLoading,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!service || typeof service[methodName] !== "function") {
        const errorMessage = `Service method ${methodName} not found`
        console.error(errorMessage, service)
        throw new Error(errorMessage)
      }

      try {
        const result = await service[methodName](...args)
        return result
      } catch (err: any) {
        const errorMessage = err?.message || "Falha ao carregar dados do banco"
        console.error(`[useNeonData] Error calling ${methodName}:`, err)
        throw new Error(errorMessage)
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  // Real-time updates would need to be implemented separately
  // Neon doesn't have built-in real-time like Supabase
  // You could use polling or websockets if needed

  return {
    data: data as TResult | undefined,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  }
}

// Export with original name for compatibility
export { useNeonData as useSupabaseData }
