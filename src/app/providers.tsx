"use client";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useServerInsertedHTML } from "next/navigation";
// import { ThemeProvider } from "next-themes"
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
  const [mounted, setMounted] = useState(false);
  const { extractCritical } = createEmotionServer(emotionCache);

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
          revalidateOnReconnect: true,
          revalidateOnMount: true,
          revalidateIfStale: true,
        }}
      >
        <ChakraProvider value={defaultSystem}>
          <AuthProvider>{children}</AuthProvider>
        </ChakraProvider>
      </SWRConfig>
    </CacheProvider>
  );
}
