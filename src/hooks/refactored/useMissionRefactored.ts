import { useCallback } from 'react';
import { useSupabaseCRUD } from '../base/useSupabaseCRUD';
import { useSupabaseQuery, createMutation, getSupabaseClient } from '../base/useSupabaseQuery';
import { Mission, CreateMission, UpdateMission } from '@/types';
import { CreateMissionQuestion } from '@/types/missionQuestions';

// Mission CRUD 훅
export function useMissionRefactored() {
  const crud = useSupabaseCRUD({
    tableName: 'missions',
    cacheKey: 'missions',
  });

  // 질문과 함께 미션 생성
  const createMissionWithQuestions = createMutation<
    { mission: Mission; questions: any[] },
    { missionData: CreateMission; questions: CreateMissionQuestion[] }
  >(
    async (supabase, { missionData, questions }) => {
      // 트랜잭션 처리
      const { data: mission, error: missionError } = await supabase
        .from('missions')
        .insert(missionData)
        .select()
        .single();

      if (missionError) throw missionError;

      let missionQuestions: any[] = [];
      
      if (questions.length > 0) {
        const questionsWithMissionId = questions.map((q, index) => ({
          ...q,
          mission_id: mission.id,
          order_index: index,
        }));

        const { data: questionsData, error: questionsError } = await supabase
          .from('mission_questions')
          .insert(questionsWithMissionId)
          .select();

        if (questionsError) throw questionsError;
        missionQuestions = questionsData || [];
      }

      return { mission: mission as Mission, questions: missionQuestions };
    },
    {
      revalidateKeys: ['missions'],
    }
  );

  // 특정 미션 ID로 조회
  const getMissionById = useCallback(
    (id: string) => crud.data.find(mission => mission.id === id) as Mission | undefined,
    [crud.data]
  );

  return {
    missions: crud.data as Mission[],
    isLoading: crud.isLoading,
    error: crud.error,
    mutate: crud.refetch,
    
    // CRUD 작업
    createMission: async (missionData: CreateMission) => {
      return await crud.create(missionData) as Mission;
    },
    
    updateMission: async (id: string, missionData: UpdateMission) => {
      return await crud.update({ id, data: missionData }) as Mission;
    },
    
    deleteMission: async (id: string) => {
      return await crud.remove(id);
    },
    
    getMissionById,
    createMissionWithQuestions,
  };
}

// 미션과 질문을 함께 조회하는 훅
export function useMissionWithQuestions(missionId: string | null) {
  return useSupabaseQuery(
    missionId ? `mission-with-questions:${missionId}` : null,
    async (supabase) => {
      if (!missionId) throw new Error('Mission ID is required');

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          mission_questions (
            *
          )
        `)
        .eq('id', missionId)
        .single();

      if (error) throw error;

      // 질문을 order_index로 정렬
      if (data.mission_questions) {
        data.mission_questions.sort((a, b) => a.order_index - b.order_index);
      }

      return data;
    }
  );
}

// 레거시 미션 마이그레이션
export function useMissionMigration() {
  const migrateLegacyMission = createMutation<any, string>(
    async (supabase, missionId) => {
      // 기존 미션 조회
      const { data: mission, error: fetchError } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();

      if (fetchError) throw fetchError;
      if (!mission) throw new Error('Mission not found');

      // 이미 마이그레이션된 경우
      const { data: existingQuestions } = await supabase
        .from('mission_questions')
        .select('id')
        .eq('mission_id', missionId)
        .limit(1);

      if (existingQuestions && existingQuestions.length > 0) {
        return { message: 'Already migrated' };
      }

      // 레거시 데이터로부터 질문 생성
      let questions: CreateMissionQuestion[] = [];

      if (mission.content || mission.description) {
        questions.push({
          question_text: mission.content || mission.description || '미션을 수행해주세요',
          question_type: mission.mission_type === 'image' ? 'image_upload' : 'essay',
          required: true,
          order_index: 0,
          max_length: mission.mission_type === 'text' ? 1000 : undefined,
          allow_multiple_images: mission.mission_type === 'image',
        });
      }

      // 질문 삽입
      if (questions.length > 0) {
        const { error: insertError } = await supabase
          .from('mission_questions')
          .insert(questions.map(q => ({ ...q, mission_id: missionId })));

        if (insertError) throw insertError;
      }

      // 미션 타입 업데이트
      const { error: updateError } = await supabase
        .from('missions')
        .update({ mission_type: 'structured' })
        .eq('id', missionId);

      if (updateError) throw updateError;

      return { message: 'Migration successful', questionsCreated: questions.length };
    },
    {
      revalidateKeys: ['missions', 'mission-with-questions'],
    }
  );

  return { migrateLegacyMission };
}