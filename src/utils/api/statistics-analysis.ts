import { WordFrequencyResult, GroupWordsResult } from '@/types/statistics-report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.squeezeedu.com';

// Analyze word frequency for a given text
export async function analyzeWordFrequency(
  text: string,
  token: string,
  options?: {
    minCount?: number;
    topN?: number;
  }
): Promise<WordFrequencyResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/word-frequency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      text,
      ...(options?.minCount && { min_count: options.minCount }),
      ...(options?.topN && { top_n: options.topN }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to analyze word frequency: ${error}`);
  }

  return response.json();
}

// Analyze word frequency for a range (journey, week, etc.)
export async function analyzeRangeWordFrequency(
  params: {
    journeyId?: string;
    journeyWeekId?: string;
    missionInstanceId?: string;
    userId?: string;
    topN?: number;
    minCount?: number;
    forceRefresh?: boolean;
  },
  token: string
): Promise<WordFrequencyResult & { scope?: string; range?: any }> {
  const queryParams = new URLSearchParams();
  if (params.journeyId) queryParams.append('journey_id', params.journeyId);
  if (params.journeyWeekId) queryParams.append('journey_week_id', params.journeyWeekId);
  if (params.missionInstanceId) queryParams.append('mission_instance_id', params.missionInstanceId);
  if (params.userId) queryParams.append('user_id', params.userId);
  if (params.topN) queryParams.append('top_n', params.topN.toString());
  if (params.minCount) queryParams.append('min_count', params.minCount.toString());
  if (params.forceRefresh) queryParams.append('force_refresh', 'true');

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/range-word-frequency?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to analyze range word frequency: ${error}`);
  }

  return response.json();
}

// Group words by similarity
export async function groupWords(
  words: string[],
  token: string,
  nClusters?: number
): Promise<GroupWordsResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/group-words`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      words,
      ...(nClusters && { n_clusters: nClusters }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to group words: ${error}`);
  }

  return response.json();
}

// Combined function to get fresh statistics with saved word groups
export async function applyReportToLatestData(
  params: {
    journeyId: string;
    wordGroups: Array<{ id: string; name: string; words: string[]; color: string }>;
    minFrequency?: number;
    topN?: number;
  },
  token: string
) {
  try {
    // 1. Get latest word frequency data from the journey
    const frequencyData = await analyzeRangeWordFrequency(
      {
        journeyId: params.journeyId,
        topN: params.topN || 100,
        minCount: params.minFrequency || 2,
      },
      token
    );

    // 2. Apply word groups to the frequency data
    const groupedData = params.wordGroups.map(group => {
      const groupFrequencies = frequencyData.word_frequency
        .filter(([word]) => group.words.includes(word))
        .sort((a, b) => b[1] - a[1]); // Sort by frequency descending

      const totalFrequency = groupFrequencies.reduce((sum, [, freq]) => sum + freq, 0);

      return {
        ...group,
        frequencies: groupFrequencies,
        totalFrequency,
      };
    });

    // 3. Get ungrouped words (words not in any group)
    const groupedWords = new Set(params.wordGroups.flatMap(g => g.words));
    const ungroupedFrequencies = frequencyData.word_frequency
      .filter(([word]) => !groupedWords.has(word))
      .sort((a, b) => b[1] - a[1]);

    return {
      groupedData,
      ungroupedFrequencies,
      totalWords: frequencyData.total_words,
      uniqueWords: frequencyData.unique_words,
      totalPosts: frequencyData.total_posts,
      analyzedAt: frequencyData.analyzed_at || new Date().toISOString(),
      cacheHit: frequencyData.cache_hit,
    };
  } catch (error) {
    console.error('Error applying report to latest data:', error);
    throw error;
  }
}