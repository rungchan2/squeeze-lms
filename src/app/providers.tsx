'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from "@/components/ui/provider"
import { useState, useEffect } from 'react'
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Provider>{children}</Provider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 