import useSWR from 'swr';
import { useCallback } from 'react';
import { 
  CreateMissionQuestion, 
  UpdateMissionQuestion, 
  MissionQuestion,
  defaultQuestionTemplates 
} from '@/types/missionQuestions';
import { 
  getMissionQuestions,
  createMissionQuestion,
  updateMissionQuestion,
  deleteMissionQuestion,
  reorderMissionQuestions 
} from '@/utils/data/mission';

/**
 * 미션 질문 관리 훅
 * @param missionId 미션 ID
 * @returns 질문 데이터와 CRUD 함수들
 */
export function useMissionQuestions(missionId: string | null) {
  // 데이터 가져오기 함수
  const fetcher = useCallback(async () => {
    if (!missionId) return [];
    
    const { data, error } = await getMissionQuestions(missionId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Ensure all questions have the multiple_select field for backward compatibility
    const questionsWithDefaults = (data || []).map(question => ({
      ...question,
      multiple_select: question.multiple_select ?? false, // Default to false if null/undefined
    }));
    
    return questionsWithDefaults;
  }, [missionId]);

  // SWR 훅 사용
  const {
    data: questions,
    error,
    isLoading,
    mutate
  } = useSWR<MissionQuestion[]>(
    missionId ? `mission-questions-${missionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );

  /**
   * 질문 생성 함수
   * @param questionData 생성할 질문 데이터
   * @returns 생성된 질문 데이터
   */
  const createQuestion = useCallback(async (questionData: CreateMissionQuestion) => {
    const { data, error } = await createMissionQuestion(questionData);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [mutate]);

  /**
   * 질문 업데이트 함수
   * @param id 업데이트할 질문 ID
   * @param questionData 업데이트할 질문 데이터
   * @returns 업데이트된 질문 데이터
   */
  const updateQuestion = useCallback(async (id: string, questionData: UpdateMissionQuestion) => {
    const { data, error } = await updateMissionQuestion(id, questionData);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return data;
  }, [mutate]);

  /**
   * 질문 삭제 함수
   * @param id 삭제할 질문 ID
   * @returns 삭제 성공 여부
   */
  const deleteQuestion = useCallback(async (id: string) => {
    const { error } = await deleteMissionQuestion(id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return true;
  }, [mutate]);

  /**
   * 질문 순서 변경 함수
   * @param questionUpdates 순서 업데이트 배열
   * @returns 업데이트 성공 여부
   */
  const reorderQuestions = useCallback(async (
    questionUpdates: { id: string; question_order: number }[]
  ) => {
    const { error } = await reorderMissionQuestions(questionUpdates);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 캐시 업데이트
    mutate();
    
    return true;
  }, [mutate]);

  /**
   * 새 질문 추가 (템플릿 기반)
   * @param questionType 질문 타입
   * @param missionId 미션 ID
   * @returns 생성된 질문 데이터
   */
  const addQuestionFromTemplate = useCallback(async (
    questionType: 'essay' | 'multiple_choice' | 'image_upload' | 'mixed',
    targetMissionId: string
  ) => {
    if (!targetMissionId) {
      throw new Error('Mission ID is required');
    }

    const template = defaultQuestionTemplates[questionType];
    const nextOrder = (questions?.length || 0) + 1;
    
    const questionData: CreateMissionQuestion = {
      ...template,
      mission_id: targetMissionId,
      question_order: nextOrder,
    };
    
    return await createQuestion(questionData);
  }, [questions, createQuestion]);

  /**
   * 질문 복제 함수
   * @param questionId 복제할 질문 ID
   * @returns 복제된 질문 데이터
   */
  const duplicateQuestion = useCallback(async (questionId: string) => {
    const question = questions?.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const nextOrder = (questions?.length || 0) + 1;
    
    const duplicatedData: CreateMissionQuestion = {
      mission_id: question.mission_id,
      question_text: `${question.question_text} (복사본)`,
      question_type: question.question_type,
      question_order: nextOrder,
      options: question.options,
      correct_answer: question.correct_answer,
      max_images: question.max_images,
      points: question.points,
      is_required: question.is_required,
      max_characters: question.max_characters,
      min_characters: question.min_characters,
      placeholder_text: question.placeholder_text,
      required_image: question.required_image,
      multiple_select: question.multiple_select,
    };
    
    return await createQuestion(duplicatedData);
  }, [questions, createQuestion]);

  /**
   * 질문 위치 이동 함수
   * @param questionId 이동할 질문 ID
   * @param newOrder 새로운 순서
   * @returns 업데이트 성공 여부
   */
  const moveQuestion = useCallback(async (questionId: string, newOrder: number) => {
    if (!questions) return false;

    const currentQuestion = questions.find(q => q.id === questionId);
    if (!currentQuestion) return false;

    const currentOrder = currentQuestion.question_order;
    if (currentOrder === newOrder) return true;

    // 다른 질문들의 순서 조정
    const updates = questions
      .filter(q => q.id !== questionId)
      .map(q => {
        let adjustedOrder = q.question_order;
        
        if (currentOrder < newOrder) {
          // 아래로 이동: 사이에 있는 질문들을 위로
          if (q.question_order > currentOrder && q.question_order <= newOrder) {
            adjustedOrder = q.question_order - 1;
          }
        } else {
          // 위로 이동: 사이에 있는 질문들을 아래로
          if (q.question_order >= newOrder && q.question_order < currentOrder) {
            adjustedOrder = q.question_order + 1;
          }
        }
        
        return { id: q.id, question_order: adjustedOrder };
      })
      .concat([{ id: questionId, question_order: newOrder }]);

    return await reorderQuestions(updates);
  }, [questions, reorderQuestions]);

  /**
   * 질문별 총 점수 계산
   * @returns 총 점수
   */
  const getTotalPoints = useCallback(() => {
    return questions?.reduce((total, q) => total + (q.points || 0), 0) || 0;
  }, [questions]);

  /**
   * 필수 질문 개수 조회
   * @returns 필수 질문 개수
   */
  const getRequiredQuestionsCount = useCallback(() => {
    return questions?.filter(q => q.is_required).length || 0;
  }, [questions]);

  /**
   * 질문 타입별 개수 조회
   * @returns 타입별 개수 객체
   */
  const getQuestionTypeStats = useCallback(() => {
    const stats = {
      essay: 0,
      multiple_choice: 0,
      image_upload: 0,
      mixed: 0,
    };

    questions?.forEach(q => {
      stats[q.question_type]++;
    });

    return stats;
  }, [questions]);

  return {
    questions: questions || [],
    isLoading,
    error,
    mutate,
    
    // CRUD operations
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    
    // Helper functions
    addQuestionFromTemplate,
    duplicateQuestion,
    moveQuestion,
    
    // Statistics
    getTotalPoints,
    getRequiredQuestionsCount,
    getQuestionTypeStats,
  };
}