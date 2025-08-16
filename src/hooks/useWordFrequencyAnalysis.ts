import useSWR from "swr";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface WordFrequencyParams {
  journey_id?: string;
  journey_week_id?: string;
  mission_instance_id?: string;
  user_id?: string;
  top_n?: number;
  min_count?: number;
  force_refresh?: boolean;
}

export interface WordFrequencyResponse {
  scope: string;
  range: Record<string, string>;
  cache_hit: boolean;
  word_frequency: [string, number][];
  total_posts: number;
  analyzed_at: string;
}

const API_BASE_URL = "https://api.squeezeedu.com";

async function fetchWordFrequency(
  params: WordFrequencyParams,
  token: string
): Promise<WordFrequencyResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  const url = `${API_BASE_URL}/api/v1/analyze/range-word-frequency?${searchParams}`;
  
  console.group('🔍 Word Frequency API Request');
  console.log('📋 Request URL:', url);
  console.log('📝 Request Params:', params);
  console.log('🔑 Token Present:', !!token);
  console.log('🔑 Token Length:', token?.length || 0);
  console.log('🔑 Token Preview:', token ? `${token.substring(0, 20)}...` : 'No token');
  console.groupEnd();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.group('📡 Word Frequency API Response');
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    console.log('✅ Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('✅ Response URL:', response.url);
    console.log('✅ Response Type:', response.type);
    console.log('✅ Response Redirected:', response.redirected);

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      let errorBody = null;
      
      try {
        // Clone response to read body multiple times
        const responseClone = response.clone();
        const contentType = response.headers.get('content-type');
        
        console.log('❌ Error Response Content-Type:', contentType);
        
        if (contentType?.includes('application/json')) {
          errorBody = await responseClone.json();
          errorDetails = JSON.stringify(errorBody, null, 2);
          console.log('❌ Error Response JSON Body:', errorBody);
        } else {
          errorBody = await responseClone.text();
          errorDetails = errorBody;
          console.log('❌ Error Response Text Body:', errorBody);
        }
      } catch (parseError) {
        console.error('❌ Error parsing response body:', parseError);
        try {
          // Fallback: try to read as text
          const textBody = await response.text();
          console.log('❌ Fallback Text Body:', textBody);
          errorBody = textBody;
          errorDetails = textBody;
        } catch (fallbackError) {
          console.error('❌ Fallback parsing also failed:', fallbackError);
        }
      }

      console.error('❌ API Error Summary:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorBody,
        bodyType: typeof errorBody,
        bodyLength: errorBody ? String(errorBody).length : 0,
        requestParams: params
      });
      
      console.groupEnd();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorDetails}`);
    }

    const data = await response.json();
    console.log('✅ Response Data:', data);
    console.log('✅ Word Count:', data.word_frequency?.length || 0);
    console.log('✅ Total Posts:', data.total_posts);
    console.log('✅ Cache Hit:', data.cache_hit);
    console.groupEnd();

    return data;
  } catch (error) {
    console.group('💥 Word Frequency API Error');
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

export function useWordFrequencyAnalysis(params: WordFrequencyParams) {
  const { session } = useSupabaseAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const organizationId = session?.user?.app_metadata?.organization_id;

  const shouldFetch = Boolean(token && (params.journey_id || params.user_id));
  
  // 캐시 키에 organization_id와 user_id 포함하여 격리
  const cacheKey = shouldFetch
    ? ["word-frequency", params, organizationId, userId, token?.substring(0, 20)]
    : null;

  // Debug logging for hook usage
  console.group('🎯 useWordFrequencyAnalysis Hook');
  console.log('🔧 Hook Params:', params);
  console.log('🔑 Session Present:', !!session);
  console.log('🔑 Token Present:', !!token);
  console.log('🏢 Organization ID:', organizationId);
  console.log('👤 User ID:', userId);
  console.log('✅ Should Fetch:', shouldFetch);
  console.log('🔄 Cache Key:', cacheKey);
  console.groupEnd();

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    () => {
      console.log('🚀 SWR Fetcher called for Word Frequency');
      return fetchWordFrequency(params, token!);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5분간 중복 요청 방지
      onError: (error) => {
        console.group('💥 SWR Error in useWordFrequencyAnalysis');
        console.error('❌ SWR Error:', error);
        console.error('❌ Params that failed:', params);
        console.groupEnd();
      },
      onSuccess: (data) => {
        console.group('✅ SWR Success in useWordFrequencyAnalysis');
        console.log('✅ Data received:', data);
        console.log('✅ For params:', params);
        console.groupEnd();
      }
    }
  );

  return {
    data,
    error,
    isLoading,
    refetch: mutate,
  };
}

// 여러 주차의 단어 빈도를 분석하는 훅
export function useMultiWeekWordFrequency(
  journey_id: string,
  week_ids: string[],
  user_id?: string
) {
  const { session } = useSupabaseAuth();
  const token = session?.access_token;

  const shouldFetch = Boolean(token && journey_id && week_ids.length > 0);

  // 조직 및 사용자 ID 포함하여 캐시 격리
  const sessionUserId = session?.user?.id;
  const organizationId = session?.user?.app_metadata?.organization_id;

  // 개별 학생 분석 vs 전체 학생 분석 구분
  const isIndividualAnalysis = Boolean(user_id);

  // Debug logging for multi-week analysis
  console.group('🎯 useMultiWeekWordFrequency Hook');
  console.log('🔧 Journey ID:', journey_id);
  console.log('🔧 Week IDs:', week_ids);
  console.log('🔧 User ID (분석 대상):', user_id);
  console.log('🏢 Organization ID:', organizationId);
  console.log('👤 Session User ID:', sessionUserId);
  console.log('📊 Analysis Mode:', isIndividualAnalysis ? 'Individual Student' : 'All Students Combined');
  console.log('✅ Should Fetch:', shouldFetch);
  console.groupEnd();

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? ["multi-week-word-frequency", journey_id, week_ids, user_id, organizationId, sessionUserId, token?.substring(0, 20)] : null,
    async () => {
      if (isIndividualAnalysis) {
        // 개별 학생: 각 주차별로 개별 요청
        const promises = week_ids.map(week_id => 
          fetchWordFrequency({
            journey_id,
            journey_week_id: week_id,
            user_id,
            top_n: 20,
            min_count: 1
          }, token!)
        );
        return await Promise.all(promises);
      } else {
        // 전체 학생: 각 주차별로 모든 학생 데이터 합쳐서 분석 (user_id 없음)
        const promises = week_ids.map(week_id => 
          fetchWordFrequency({
            journey_id,
            journey_week_id: week_id,
            // user_id 제외 - 백엔드에서 해당 주차의 모든 학생 데이터 분석
            top_n: 20,
            min_count: 1
          }, token!)
        );
        return await Promise.all(promises);
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  // 결과를 동일한 형태로 반환
  const results = week_ids.map((week_id, index) => ({
    data: data?.[index],
    error: null,
    isLoading: isLoading,
    refetch: mutate,
  }));

  return {
    results,
    isLoading,
    error,
    refetch: mutate,
  };
}