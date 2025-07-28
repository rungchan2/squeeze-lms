import { createClient } from "@/utils/supabase/client";
import { CreateMission, MissionWithQuestions, legacyMissionTypes } from "@/types";
import { 
  CreateMissionQuestion, 
  UpdateMissionQuestion 
} from "@/types/missionQuestions";

export async function getMissionById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createMission(mission: CreateMission) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").insert(mission);
  return { data, error };
}

export async function updateMission(id: string, mission: CreateMission) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").update(mission).eq("id", id);
  return { data, error };
}

export async function deleteMission(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("missions").delete().eq("id", id);
  return { data, error };
}

export async function getMissionTypes() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_distinct_mission_types" as any
  );
  return { data, error };
}

// Get mission with questions
export async function getMissionWithQuestions(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select(`
      *,
      questions:mission_questions(*)
    `)
    .eq("id", id)
    .single();
  
  if (error) return { data: null, error };
  
  // Sort questions by order
  const mission = data as MissionWithQuestions;
  if (mission.questions) {
    mission.questions.sort((a, b) => a.question_order - b.question_order);
  }
  
  return { data: mission, error: null };
}

// Create mission with questions
export async function createMissionWithQuestions(
  mission: CreateMission, 
  questions: CreateMissionQuestion[] = []
) {
  const supabase = createClient();
  
  try {
    // Start transaction by creating mission first
    const { data: missionData, error: missionError } = await supabase
      .from("missions")
      .insert(mission)
      .select()
      .single();
    
    if (missionError) throw missionError;
    
    // If no questions provided, create a default question for backward compatibility
    if (questions.length === 0 && mission.description) {
      const defaultQuestion: CreateMissionQuestion = {
        mission_id: missionData.id,
        question_text: mission.description,
        question_type: 'essay',
        question_order: 1,
        points: mission.points || 100,
        is_required: true,
        options: null,
        correct_answer: null,
        max_images: null,
        max_characters: null,
        min_characters: null,
        placeholder_text: "미션가이드에 따라 미션을 완료해주세요.",
        required_image: null,
        multiple_select: null,
      };
      questions = [defaultQuestion];
    }
    
    // Create questions if provided
    if (questions.length > 0) {
      const questionsWithMissionId = questions.map((q, index) => ({
        ...q,
        mission_id: missionData.id,
        question_order: q.question_order || index + 1,
      }));
      
      const { error: questionsError } = await supabase
        .from("mission_questions")
        .insert(questionsWithMissionId);
      
      if (questionsError) {
        // Cleanup: delete the mission if questions creation failed
        await supabase.from("missions").delete().eq("id", missionData.id);
        throw questionsError;
      }
    }
    
    return { data: missionData, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

// Mission Questions CRUD Operations

export async function getMissionQuestions(missionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mission_questions")
    .select("*")
    .eq("mission_id", missionId)
    .order("question_order", { ascending: true });
  
  return { data, error };
}

export async function createMissionQuestion(question: CreateMissionQuestion) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mission_questions")
    .insert(question)
    .select()
    .single();
  
  return { data, error };
}

export async function updateMissionQuestion(id: string, question: UpdateMissionQuestion) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mission_questions")
    .update(question)
    .eq("id", id)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteMissionQuestion(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mission_questions")
    .delete()
    .eq("id", id);
  
  return { data, error };
}

export async function reorderMissionQuestions(
  questionUpdates: { id: string; question_order: number }[]
) {
  const supabase = createClient();
  
  try {
    const promises = questionUpdates.map(({ id, question_order }) =>
      supabase
        .from("mission_questions")
        .update({ question_order })
        .eq("id", id)
    );
    
    await Promise.all(promises);
    return { data: null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

// Utility functions for backward compatibility

export async function migrateLegacyMission(missionId: string) {
  const supabase = createClient();
  
  try {
    // Get mission data
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();
    
    if (missionError) throw missionError;
    
    // Check if already has questions
    const { data: existingQuestions } = await supabase
      .from("mission_questions")
      .select("id")
      .eq("mission_id", missionId)
      .limit(1);
    
    if (existingQuestions && existingQuestions.length > 0) {
      return { data: null, error: new Error("Mission already has questions") };
    }
    
    // Create default question from mission description
    if (mission.description) {
      const defaultQuestion: CreateMissionQuestion = {
        mission_id: missionId,
        question_text: mission.description,
        question_type: 'essay',
        question_order: 1,
        points: mission.points || 100,
        is_required: true,
        options: null,
        correct_answer: null,
        max_images: null,
        max_characters: null,
        min_characters: null,
        placeholder_text: "미션가이드에 따라 미션을 완료해주세요.",
        required_image: null,
        multiple_select: null,
      };
      
      const { data, error } = await createMissionQuestion(defaultQuestion);
      return { data, error };
    }
    
    return { data: null, error: new Error("No description to migrate") };
  } catch (error: any) {
    return { data: null, error };
  }
}

export function mapLegacyMissionType(legacyType: string): string {
  const mappedType = legacyMissionTypes[legacyType as keyof typeof legacyMissionTypes];
  return mappedType || 'essay';
}
