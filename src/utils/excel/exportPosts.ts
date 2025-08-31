import * as XLSX from 'xlsx';
import { PostWithRelations } from '@/types';
import { excludeHtmlTags } from '@/utils/utils';
import dayjs from '@/utils/dayjs/dayjs';
import { AnswersData, AnyAnswer } from '@/types/missionQuestions';
import { createClient } from '@/utils/supabase/client';

export interface ExcelExportData {
  posts: PostWithRelations[];
  journeyName: string;
  weeks: Array<{
    id: string;
    name: string;
    week_number: number | null;
  }>;
  missionInstances: Array<{
    id: string;
    journey_week_id: string;
    mission_id: string;
    mission?: {
      id: string;
      name: string;
    };
  }>;
}

// Helper function to format answer based on type
const formatAnswer = (answer: AnyAnswer): string => {
  switch (answer.answer_type) {
    case 'essay':
      return answer.answer_text ? excludeHtmlTags(answer.answer_text) : '답변 없음';
    
    case 'multiple_choice':
      return answer.selected_option || '선택 없음';
    
    case 'image_upload':
      const imageText = answer.answer_text ? excludeHtmlTags(answer.answer_text) : '';
      const imageCount = answer.image_urls?.length || 0;
      return imageText ? `${imageText} (이미지 ${imageCount}개)` : `이미지 ${imageCount}개 업로드`;
    
    case 'mixed':
      const mixedText = answer.answer_text ? excludeHtmlTags(answer.answer_text) : '';
      const mixedImageCount = answer.image_urls?.length || 0;
      if (mixedText && mixedImageCount > 0) {
        return `${mixedText} (이미지 ${mixedImageCount}개)`;
      } else if (mixedText) {
        return mixedText;
      } else if (mixedImageCount > 0) {
        return `이미지 ${mixedImageCount}개 업로드`;
      }
      return '답변 없음';
    
    default:
      return '알 수 없는 형식';
  }
};

// Helper function to extract structured answers from answers_data
const extractStructuredAnswers = (answersData: any): Record<string, string> => {
  const result: Record<string, string> = {};
  
  if (!answersData || typeof answersData !== 'object') {
    return result;
  }

  // Parse if it's a string (JSON string from database)
  let parsedData: AnswersData;
  try {
    parsedData = typeof answersData === 'string' ? JSON.parse(answersData) : answersData;
  } catch (error) {
    console.error('Failed to parse answers_data:', error);
    return result;
  }

  // Check if it has the expected structure
  if (parsedData.answers && Array.isArray(parsedData.answers)) {
    // Sort answers by question_order
    const sortedAnswers = [...parsedData.answers].sort((a, b) => a.question_order - b.question_order);
    
    sortedAnswers.forEach((answer, index) => {
      const questionKey = `문항 ${answer.question_order}`;
      result[questionKey] = formatAnswer(answer);
      
      // Add score if available
      if (answer.points_earned !== null && answer.points_earned !== undefined) {
        result[`${questionKey} 점수`] = String(answer.points_earned);
      }
    });

    // Add submission metadata
    if (parsedData.submission_metadata) {
      const totalQuestions = parsedData.submission_metadata.total_questions || 0;
      const answeredQuestions = parsedData.submission_metadata.answered_questions || 0;
      const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
      
      result['총 문항수'] = String(totalQuestions);
      result['답변 문항수'] = String(answeredQuestions);
      result['완료율'] = `${completionRate.toFixed(1)}%`;
    }
  }

  return result;
};

// Helper function to get Korean question type names
const getQuestionTypeKorean = (type: string): string => {
  switch (type) {
    case 'essay':
      return '서술형';
    case 'multiple_choice':
      return '객관식';
    case 'image_upload':
      return '이미지';
    case 'mixed':
      return '혼합형';
    default:
      return type;
  }
};

// Helper function to fetch mission questions by IDs (same approach as PostCard)
const fetchMissionQuestionsByIds = async (questionIds: string[]) => {
  if (questionIds.length === 0) return [];

  try {
    const supabase = createClient();
    const { data: questions, error } = await supabase
      .from('mission_questions')
      .select('*')
      .in('id', questionIds);

    if (error) {
      console.error('Failed to fetch mission questions:', error);
      return [];
    }

    return questions || [];
  } catch (error) {
    console.error('Error fetching mission questions:', error);
    return [];
  }
};

export const exportPostsToExcel = async (data: ExcelExportData) => {
  const { posts, journeyName, weeks, missionInstances } = data;

  // Create a mapping for week information
  const weekMap = new Map(weeks.map(week => [week.id, week]));
  
  // Create a mapping for mission instance to week
  const missionInstanceToWeekMap = new Map(
    missionInstances.map(instance => [instance.id, instance.journey_week_id])
  );

  // Get all unique question IDs from posts' answers_data (same approach as PostCard)
  const allQuestionIds = [...new Set(
    posts
      .map(post => {
        if (post.answers_data) {
          const structuredAnswers = extractStructuredAnswers(post.answers_data);
          // Extract question IDs from answers structure
          let parsedData;
          try {
            parsedData = typeof post.answers_data === 'string' ? JSON.parse(post.answers_data) : post.answers_data;
          } catch {
            return [];
          }
          if (parsedData.answers && Array.isArray(parsedData.answers)) {
            return parsedData.answers.map((answer: any) => answer.question_id).filter(Boolean);
          }
        }
        return [];
      })
      .flat()
  )];

  // Fetch all questions by IDs 
  const allQuestions = await fetchMissionQuestionsByIds(allQuestionIds);
  
  // Create a map for easy lookup
  const questionsMap = new Map(allQuestions.map(q => [q.id, q]));

  // Find the maximum number of questions across all posts for dynamic columns
  let maxQuestions = 0;
  const questionHeaders = new Map<number, { text: string; type: string }>();

  posts.forEach(post => {
    if (post.answers_data) {
      let parsedData;
      try {
        parsedData = typeof post.answers_data === 'string' ? JSON.parse(post.answers_data) : post.answers_data;
      } catch {
        return;
      }
      
      if (parsedData.answers && Array.isArray(parsedData.answers)) {
        const answers = parsedData.answers;
        maxQuestions = Math.max(maxQuestions, answers.length);
        
        // Build question headers using the fetched questions
        answers.forEach((answer: any) => {
          const question = questionsMap.get(answer.question_id);
          if (question) {
            const questionNumber = answer.question_order || question.question_order;
            if (!questionHeaders.has(questionNumber)) {
              questionHeaders.set(questionNumber, {
                text: question.question_text.length > 50 
                  ? question.question_text.substring(0, 50) + '...' 
                  : question.question_text,
                type: question.question_type
              });
            }
          }
        });
      }
    }
  });

  // Transform posts data for Excel
  const excelData = posts.map(post => {
    // Get week information
    const missionInstanceId = (post as any).mission_instance_id;
    const weekId = missionInstanceToWeekMap.get(missionInstanceId);
    const week = weekId ? weekMap.get(weekId) : null;

    // Get mission information from journey_mission_instances
    const mission = post.journey_mission_instances?.missions;

    // Base data
    const baseData: Record<string, any> = {
      '학교명': post.profiles?.organizations?.name || '',
      '제출자 이메일': post.profiles?.email || '',
      '제출자 이름': post.profiles ? `${post.profiles.last_name || ''}${post.profiles.first_name || ''}` : '',
      '유저 가입일': post.profiles?.created_at ? dayjs(post.profiles.created_at).format('YYYY-MM-DD') : '',
      '제출일': dayjs(post.created_at).format('YYYY-MM-DD HH:mm:ss'),
      '주차': week ? `${week.week_number || ''}주차: ${week.name}` : '',
      '미션명': mission?.name || '',
      '제목': post.title,
    };

    // Extract structured answers if available
    if (post.answers_data) {
      const structuredAnswers = extractStructuredAnswers(post.answers_data);
      
      // Add structured answer columns with question text headers
      for (let i = 1; i <= maxQuestions; i++) {
        const questionHeader = questionHeaders.get(i);
        const questionKey = questionHeader 
          ? `문항 ${i}: ${questionHeader.text} [${getQuestionTypeKorean(questionHeader.type)}]`
          : `문항 ${i}`;
        
        baseData[questionKey] = structuredAnswers[`문항 ${i}`] || '';
        
        // Add score column if any post has scores
        const scoreKey = `문항 ${i} 점수`;
        if (structuredAnswers[scoreKey]) {
          baseData[`${questionKey} 점수`] = structuredAnswers[scoreKey];
        }
      }

      // Add metadata columns
      baseData['총 문항수'] = structuredAnswers['총 문항수'] || '0';
      baseData['답변 문항수'] = structuredAnswers['답변 문항수'] || '0';
      baseData['완료율'] = structuredAnswers['완료율'] || '0%';
    } else if (post.content) {
      // Fallback to legacy content field
      baseData['기존 내용'] = excludeHtmlTags(post.content);
    }

    // Add remaining fields
    baseData['총점'] = post.score || 0;
    baseData['자동 점수'] = post.auto_score || 0;
    baseData['수동 점수'] = post.manual_score || 0;
    baseData['팀 제출 여부'] = post.is_team_submission ? '팀 제출' : '개인 제출';
    baseData['팀명'] = post.teamInfo?.name || '';
    baseData['숨김 상태'] = post.is_hidden ? '숨김' : '공개';
    baseData['조회수'] = post.view_count || 0;

    return baseData;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 15 }, // 학교명
    { wch: 20 }, // 제출자 이메일
    { wch: 12 }, // 제출자 이름
    { wch: 12 }, // 유저 가입일
    { wch: 18 }, // 제출일
    { wch: 20 }, // 여정명
    { wch: 20 }, // 주차
    { wch: 20 }, // 미션명
    { wch: 30 }, // 제목
    { wch: 50 }, // 내용
    { wch: 8 },  // 점수
    { wch: 12 }, // 팀 제출 여부
    { wch: 15 }, // 팀명
    { wch: 10 }, // 숨김 상태
    { wch: 8 },  // 조회수
  ];

  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '제출된 미션');

  // Generate filename with current date
  const currentDate = dayjs().format('YYYY-MM-DD');
  const filename = `${journeyName}-posts-${currentDate}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);

  return filename;
};