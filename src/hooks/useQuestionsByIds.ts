import useSWR from 'swr';
import { getMissionQuestionsByIds } from '@/utils/data/mission';
import { MissionQuestion } from '@/types/missionQuestions';

/**
 * 질문 ID 배열로 질문들을 가져오는 훅
 * @param questionIds 질문 ID 배열
 * @returns 질문 데이터 배열
 */
export function useQuestionsByIds(questionIds: string[]) {
  const {
    data: questions,
    error,
    isLoading,
  } = useSWR<MissionQuestion[]>(
    questionIds.length > 0 ? `questions-${questionIds.join(',')}` : null,
    async () => {
      if (questionIds.length === 0) return [];
      
      const { data, error } = await getMissionQuestionsByIds(questionIds);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5분 동안 캐시 유지 (질문은 자주 변경되지 않음)
    }
  );

  return {
    questions: questions || [],
    error,
    isLoading,
  };
}