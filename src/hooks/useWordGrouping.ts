import useSWR from "swr";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface WordGroupingParams {
  words: string[];
  n_clusters?: number;
}

export interface WordGroup {
  label: string;
  words: string[];
}

export interface WordGroupingResponse {
  groups: WordGroup[];
  total_groups: number;
}

const API_BASE_URL = "https://api.squeezeedu.com";

async function fetchWordGrouping(
  params: WordGroupingParams,
  token: string
): Promise<WordGroupingResponse> {
  const url = `${API_BASE_URL}/api/v1/analyze/group-words`;
  
  console.group('🔍 Word Grouping API Request');
  console.log('📋 Request URL:', url);
  console.log('📝 Request Params:', params);
  console.log('📝 Words Count:', params.words?.length || 0);
  console.log('📝 Clusters:', params.n_clusters);
  console.log('🔑 Token Present:', !!token);
  console.log('🔑 Token Length:', token?.length || 0);
  console.groupEnd();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.group('📡 Word Grouping API Response');
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    console.log('✅ Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('✅ Response URL:', response.url);

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      let errorBody = null;
      
      try {
        const responseClone = response.clone();
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          errorBody = await responseClone.json();
          errorDetails = JSON.stringify(errorBody, null, 2);
        } else {
          errorBody = await responseClone.text();
          errorDetails = errorBody;
        }
      } catch (parseError) {
        console.error('❌ Error parsing response body:', parseError);
        errorDetails = 'Could not parse error response';
      }

      console.error('❌ API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorBody,
        requestParams: params
      });
      
      console.groupEnd();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorDetails}`);
    }

    const data = await response.json();
    console.log('✅ Response Data:', data);
    console.log('✅ Groups Count:', data.groups?.length || 0);
    console.log('✅ Total Groups:', data.total_groups);
    console.groupEnd();

    return data;
  } catch (error) {
    console.group('💥 Word Grouping API Error');
    console.error('❌ Request failed:', error);
    console.error('❌ Request URL:', url);
    console.error('❌ Request Params:', params);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ Network Error: Check CORS, network connectivity, or API server status');
    }
    
    console.groupEnd();
    throw error;
  }
}

export function useWordGrouping(params: WordGroupingParams | null) {
  const { session } = useSupabaseAuth();
  const token = session?.access_token;

  const shouldFetch = Boolean(
    token && 
    params && 
    params.words && 
    params.words.length > 0
  );
  
  const cacheKey = shouldFetch
    ? ["word-grouping", params, token]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    () => fetchWordGrouping(params!, token!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10분간 중복 요청 방지 (그룹핑 결과는 더 오래 캐시)
    }
  );

  return {
    data,
    error,
    isLoading,
    refetch: mutate,
  };
}

// 단어 빈도 데이터에서 자동으로 그룹핑을 수행하는 헬퍼 훅
export function useAutoWordGrouping(
  wordFrequency: [string, number][] | undefined,
  minFrequency: number = 1,
  maxWords: number = 20
) {
  // 단어 빈도에서 상위 단어들 추출
  const topWords = wordFrequency
    ?.filter(([, freq]) => freq >= minFrequency)
    ?.slice(0, maxWords)
    ?.map(([word]) => word) || [];

  // 그룹 수를 동적으로 결정 (단어 수의 1/3, 최소 2개, 최대 8개)
  const n_clusters = Math.min(8, Math.max(2, Math.ceil(topWords.length / 3)));

  const groupingParams = topWords.length > 0 
    ? { words: topWords, n_clusters }
    : null;

  return useWordGrouping(groupingParams);
}