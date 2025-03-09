'use client'

import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
// import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import createEmotionServer from '@emotion/server/create-instance'
import { AuthProvider } from '@/components/AuthProvider'
import { usePathname } from 'next/navigation';


interface ProvidersProps {
  children: React.ReactNode;
  excludeAuthOnLogin?: boolean;
}

export function Providers({ children}: ProvidersProps) {
  
  const [emotionCache] = useState(() => createCache({ key: 'css' }))
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)
  const { extractCritical } = createEmotionServer(emotionCache)
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');
  

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
          {isLoginPage ? (
            children
          ) : (
            <AuthProvider>
              {children}
            </AuthProvider>
          )}
        </ChakraProvider>
      </QueryClientProvider>
    </CacheProvider>
  )
} 