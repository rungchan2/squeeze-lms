import { useMemo } from 'react';
import { 
  useSupabaseQuery,
  createCacheKey,
  createMutation
} from '../base/useSupabaseQuery';
import { 
  CreateMissionQuestion, 
  UpdateMissionQuestion, 
  MissionQuestion,
  defaultQuestionTemplates 
} from '@/types/missionQuestions';

// 미션 질문 목록 조회 훅
export function useMissionQuestionsRefactored(missionId: string | null) {
  return useSupabaseQuery<MissionQuestion[]>(
    missionId ? createCacheKey('mission-questions', { missionId }) : null,
    async (supabase) => {
      if (!missionId) return [];

      const { data, error } = await supabase
        .from('mission_questions')
        .select('*')
        .eq('mission_id', missionId)
        .order('question_order', { ascending: true });

      if (error) throw error;

      // 기본값 보장 (하위 호환성)
      const questionsWithDefaults = (data || []).map(question => ({
        ...question,
        multiple_select: question.multiple_select ?? false,
      }));

      return questionsWithDefaults as MissionQuestion[];
    },
    {
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
    }
  );
}

// 단일 미션 질문 조회 훅
export function useMissionQuestionRefactored(questionId: string | null) {
  return useSupabaseQuery<MissionQuestion>(
    questionId ? createCacheKey('mission-question', { questionId }) : null,
    async (supabase) => {
      if (!questionId) throw new Error('Question ID is required');

      const { data, error } = await supabase
        .from('mission_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) throw error;
      return {
        ...data,
        multiple_select: data.multiple_select ?? false,
      } as MissionQuestion;
    }
  );
}

// 미션 질문 CRUD 작업 훅
export function useMissionQuestionActionsRefactored() {

  // 질문 생성
  const createQuestion = createMutation<MissionQuestion, CreateMissionQuestion>(
    async (supabase, questionData) => {
      const { data, error } = await supabase
        .from('mission_questions')
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;
      return data as MissionQuestion;
    },
    {
      revalidateKeys: ['mission-questions'],
    }
  );

  // 질문 업데이트
  const updateQuestion = createMutation<
    MissionQuestion, 
    { id: string; updates: UpdateMissionQuestion }
  >(
    async (supabase, { id, updates }) => {
      const { data, error } = await supabase
        .from('mission_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MissionQuestion;
    },
    {
      revalidateKeys: ['mission-questions', 'mission-question'],
    }
  );

  // 질문 삭제
  const deleteQuestion = createMutation<boolean, string>(
    async (supabase, questionId) => {
      const { error } = await supabase
        .from('mission_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: ['mission-questions'],
    }
  );

  // 질문 순서 변경
  const reorderQuestions = createMutation<
    boolean,
    { updates: { id: string; question_order: number }[] }
  >(
    async (supabase, { updates }) => {
      // 트랜잭션으로 여러 질문의 순서를 한 번에 업데이트
      const updatePromises = updates.map(({ id, question_order }) =>
        supabase
          .from('mission_questions')
          .update({ question_order })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      
      // 에러가 있는지 확인
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return true;
    },
    {
      revalidateKeys: ['mission-questions'],
    }
  );

  // 템플릿에서 질문 추가
  const addQuestionFromTemplate = createMutation<
    MissionQuestion,
    { 
      questionType: 'essay' | 'multiple_choice' | 'image_upload' | 'mixed';
      missionId: string;
      order: number;
    }
  >(
    async (supabase, { questionType, missionId, order }) => {
      const template = defaultQuestionTemplates[questionType];
      
      const questionData: CreateMissionQuestion = {
        ...template,
        mission_id: missionId,
        question_order: order,
      };

      const { data, error } = await supabase
        .from('mission_questions')
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;
      return data as MissionQuestion;
    },
    {
      revalidateKeys: ['mission-questions'],
    }
  );

  // 질문 복제
  const duplicateQuestion = createMutation<
    MissionQuestion,
    { questionId: string; newOrder: number }
  >(
    async (supabase, { questionId, newOrder }) => {
      // 원본 질문 조회
      const { data: originalQuestion, error: fetchError } = await supabase
        .from('mission_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (fetchError) throw fetchError;

      // 복제 데이터 생성
      const duplicatedData: CreateMissionQuestion = {
        mission_id: originalQuestion.mission_id,
        question_text: `${originalQuestion.question_text} (복사본)`,
        question_type: originalQuestion.question_type,
        question_order: newOrder,
        options: originalQuestion.options,
        correct_answer: originalQuestion.correct_answer,
        max_images: originalQuestion.max_images,
        points: originalQuestion.points,
        is_required: originalQuestion.is_required,
        max_characters: originalQuestion.max_characters,
        min_characters: originalQuestion.min_characters,
        placeholder_text: originalQuestion.placeholder_text,
        required_image: originalQuestion.required_image,
        multiple_select: originalQuestion.multiple_select,
      };

      const { data, error } = await supabase
        .from('mission_questions')
        .insert(duplicatedData)
        .select()
        .single();

      if (error) throw error;
      return data as MissionQuestion;
    },
    {
      revalidateKeys: ['mission-questions'],
    }
  );

  return {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    addQuestionFromTemplate,
    duplicateQuestion,
  };
}

// 질문 통계 및 유틸리티 훅
export function useMissionQuestionStatsRefactored(missionId: string | null) {
  const { data: questions } = useMissionQuestionsRefactored(missionId);

  const stats = useMemo(() => {
    if (!questions) {
      return {
        totalQuestions: 0,
        totalPoints: 0,
        requiredQuestionsCount: 0,
        questionTypeStats: {
          essay: 0,
          multiple_choice: 0,
          image_upload: 0,
          mixed: 0,
        },
      };
    }

    const totalPoints = questions.reduce((total, q) => total + (q.points || 0), 0);
    const requiredQuestionsCount = questions.filter(q => q.is_required).length;
    
    const questionTypeStats = {
      essay: 0,
      multiple_choice: 0,
      image_upload: 0,
      mixed: 0,
    };

    questions.forEach(q => {
      questionTypeStats[q.question_type]++;
    });

    return {
      totalQuestions: questions.length,
      totalPoints,
      requiredQuestionsCount,
      questionTypeStats,
    };
  }, [questions]);

  return stats;
}

// 질문 순서 관리 헬퍼 훅
export function useMissionQuestionOrderRefactored(missionId: string | null) {
  const { data: questions } = useMissionQuestionsRefactored(missionId);
  const { reorderQuestions } = useMissionQuestionActionsRefactored();

  // 질문 위치 이동
  const moveQuestion = async (questionId: string, newOrder: number) => {
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

    return await reorderQuestions.mutate({ updates });
  };

  // 다음 순서 번호 가져오기
  const getNextOrder = () => {
    return (questions?.length || 0) + 1;
  };

  return {
    moveQuestion,
    getNextOrder,
  };
}