"use client";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useServerInsertedHTML } from "next/navigation";
// import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import createEmotionServer from "@emotion/server/create-instance";
import { AuthProvider } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import useSWR, { SWRConfig } from "swr";

interface ProvidersProps {
  children: React.ReactNode;
  excludeAuthOnLogin?: boolean;
}

export function Providers({ children }: ProvidersProps) {
  const [emotionCache] = useState(() => createCache({ key: "css" }));
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  const { extractCritical } = createEmotionServer(emotionCache);
  const pathname = usePathname();
  const isLoginPage = pathname?.includes("/login");

  useEffect(() => {
    setMounted(true);
  }, []);

  useServerInsertedHTML(() => {
    const { css, ids } = extractCritical("");
    return (
      <style
        data-emotion={`css ${ids.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: css }}
      />
    );
  });

  if (!mounted) return null;

  return (
    <CacheProvider value={emotionCache}>
      <SWRConfig
        value={{
          fetcher: (url: string) => fetch(url).then((res) => res.json()),
          revalidateOnFocus: true,
          revalidateOnReconnect: false,
          revalidateOnMount: true,
          revalidateIfStale: false,
          dedupingInterval: 5000,
          errorRetryCount: 3,
          onError: (error, key) => {
            if (error && error.message) {
              if (error.message.includes("Cannot destructure property")) {
                console.warn(`[SWR 에러 - 파라미터 누락] 키: ${key}, 메시지: ${error.message}`);
                return;
              }
              
              console.error(`[SWR 글로벌 에러] 키: ${key}, 메시지: ${error.message}`);
            } else {
              console.error('[SWR 글로벌 에러] 미확인 오류 타입:', error);
            }
          }
        }}
      >
        <ChakraProvider value={defaultSystem}>
          <AuthProvider>{children}</AuthProvider>
        </ChakraProvider>
      </SWRConfig>
    </CacheProvider>
  );
}
