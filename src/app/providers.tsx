'use client'

import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
// import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import createEmotionServer from '@emotion/server/create-instance'

export function Providers({ children }: { children: React.ReactNode }) {
  const [emotionCache] = useState(() => createCache({ key: 'css' }))
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)
  const { extractCritical } = createEmotionServer(emotionCache)

  useEffect(() => {
    setMounted(true)
  }, [])

  useServerInsertedHTML(() => {
    const { css, ids } = extractCritical('')
    return (
      <style
        data-emotion={`css ${ids.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: css }}
      />
    )
  })

  if (!mounted) return null

  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={defaultSystem}>
          {/* <ThemeProvider attribute="class" defaultTheme="light"> */}
            {children}
          {/* </ThemeProvider> */}
        </ChakraProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
} 