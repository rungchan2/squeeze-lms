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

// Helper function to fetch all mission questions for given mission IDs
const fetchMissionQuestionsByMissionIds = async (missionIds: string[]) => {
  if (missionIds.length === 0) return [];

  try {
    const supabase = createClient();
    const { data: questions, error } = await supabase
      .from('mission_questions')
      .select('*')
      .in('mission_id', missionIds)
      .order('question_order', { ascending: true });

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

interface WeekQuestionInfo {
  weekNumber: number;
  weekId: string;
  weekName: string;
  missionId: string;
  missionName: string;
  questionOrder: number;
  questionId: string;
  questionText: string;
  questionType: string;
  columnKey: string; // e.g., "1-1", "1-2", "2-1"
}

export const exportPostsToExcel = async (data: ExcelExportData) => {
  const { posts, journeyName, weeks, missionInstances } = data;

  // Create a mapping for week information
  const weekMap = new Map(weeks.map(week => [week.id, week]));

  // Create a mapping for mission instance to week
  const missionInstanceToWeekMap = new Map(
    missionInstances.map(instance => [instance.id, instance.journey_week_id])
  );

  // Create a mapping for mission instance to mission
  const missionInstanceToMissionMap = new Map(
    missionInstances.map(instance => [instance.id, instance])
  );

  // Get all unique mission IDs from mission instances
  const allMissionIds = [...new Set(missionInstances.map(mi => mi.mission_id).filter(Boolean))];

  // Fetch all questions for these missions
  const allMissionQuestions = await fetchMissionQuestionsByMissionIds(allMissionIds);

  // Build a comprehensive map of week -> mission -> questions
  // This ensures all questions are captured even if no posts exist for them
  const weekMissionQuestionsMap = new Map<string, Map<string, any[]>>();

  missionInstances.forEach(instance => {
    const weekId = instance.journey_week_id;
    const missionId = instance.mission_id;

    if (!weekMissionQuestionsMap.has(weekId)) {
      weekMissionQuestionsMap.set(weekId, new Map());
    }

    const missionMap = weekMissionQuestionsMap.get(weekId)!;
    if (!missionMap.has(missionId)) {
      const questionsForMission = allMissionQuestions
        .filter(q => q.mission_id === missionId)
        .sort((a, b) => a.question_order - b.question_order);
      missionMap.set(missionId, questionsForMission);
    }
  });

  // Build ordered question columns based on week_number
  // Format: {weekNumber}-{questionOrder} (e.g., 1-1, 1-2, 2-1)
  const orderedQuestionColumns: WeekQuestionInfo[] = [];

  // Sort weeks by week_number
  const sortedWeeks = [...weeks].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));

  sortedWeeks.forEach(week => {
    const missionMap = weekMissionQuestionsMap.get(week.id);
    if (!missionMap) return;

    // For each week, get all questions sorted by mission and question_order
    const questionsInWeek: Array<{
      missionInstance: any;
      question: any;
    }> = [];

    // Find mission instances for this week
    const weekMissionInstances = missionInstances.filter(mi => mi.journey_week_id === week.id);

    weekMissionInstances.forEach(mi => {
      const questions = missionMap.get(mi.mission_id) || [];
      questions.forEach(q => {
        questionsInWeek.push({
          missionInstance: mi,
          question: q,
        });
      });
    });

    // Sort by question order within the week
    questionsInWeek.sort((a, b) => a.question.question_order - b.question.question_order);

    // Create column entries
    questionsInWeek.forEach((item, idx) => {
      const questionNumber = idx + 1;
      const columnKey = `${week.week_number || 0}-${questionNumber}`;

      orderedQuestionColumns.push({
        weekNumber: week.week_number || 0,
        weekId: week.id,
        weekName: week.name,
        missionId: item.missionInstance.mission_id,
        missionName: item.missionInstance.mission?.name || '',
        questionOrder: item.question.question_order,
        questionId: item.question.id,
        questionText: item.question.question_text,
        questionType: item.question.question_type,
        columnKey,
      });
    });
  });

  // Create a map from questionId to columnKey for quick lookup
  const questionIdToColumnKey = new Map<string, string>();
  orderedQuestionColumns.forEach(col => {
    questionIdToColumnKey.set(col.questionId, col.columnKey);
  });

  // Build column headers based on ordered questions
  const questionColumnHeaders: { key: string; header: string }[] = orderedQuestionColumns.map(col => {
    const shortText = col.questionText.length > 30
      ? col.questionText.substring(0, 30) + '...'
      : col.questionText;
    return {
      key: col.columnKey,
      header: `${col.columnKey}회차: ${shortText} [${getQuestionTypeKorean(col.questionType)}]`,
    };
  });

  // Transform posts data for Excel
  const excelData = posts.map(post => {
    // Get week information
    const missionInstanceId = (post as any).mission_instance_id;
    const weekId = missionInstanceToWeekMap.get(missionInstanceId);
    const week = weekId ? weekMap.get(weekId) : null;

    // Get mission information from journey_mission_instances
    const mission = post.journey_mission_instances?.missions;

    // Base data - exact order as requested
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

    // Initialize all question columns with empty values
    questionColumnHeaders.forEach(col => {
      baseData[col.header] = '';
    });

    // Extract structured answers if available
    if (post.answers_data) {
      let parsedData: AnswersData;
      try {
        parsedData = typeof post.answers_data === 'string'
          ? JSON.parse(post.answers_data)
          : post.answers_data;
      } catch {
        parsedData = { answers: [], submission_metadata: { total_questions: 0, answered_questions: 0, submission_time: '' } };
      }

      if (parsedData.answers && Array.isArray(parsedData.answers)) {
        parsedData.answers.forEach(answer => {
          const columnKey = questionIdToColumnKey.get(answer.question_id);
          if (columnKey) {
            // Find the corresponding header
            const colHeader = questionColumnHeaders.find(h => h.key === columnKey);
            if (colHeader) {
              baseData[colHeader.header] = formatAnswer(answer);
            }
          }
        });
      }
    } else if (post.content) {
      // Fallback to legacy content field - put in a generic column
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

  // Define the exact column order
  const baseColumns = [
    '학교명',
    '제출자 이메일',
    '제출자 이름',
    '유저 가입일',
    '제출일',
    '주차',
    '미션명',
    '제목',
  ];

  const questionHeaders = questionColumnHeaders.map(h => h.header);

  const trailingColumns = [
    '기존 내용',
    '총점',
    '자동 점수',
    '수동 점수',
    '팀 제출 여부',
    '팀명',
    '숨김 상태',
    '조회수',
  ];

  const allColumns = [...baseColumns, ...questionHeaders, ...trailingColumns];

  // Filter out columns that don't exist in any data row
  const columnsWithData = allColumns.filter(col => {
    return excelData.some(row => row[col] !== undefined && row[col] !== '');
  });

  // Ensure base columns are always present even if empty
  const finalColumns = [...new Set([...baseColumns, ...columnsWithData])];

  // Reorder data to match column order
  const orderedExcelData = excelData.map(row => {
    const orderedRow: Record<string, any> = {};
    finalColumns.forEach(col => {
      orderedRow[col] = row[col] ?? '';
    });
    return orderedRow;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(orderedExcelData, { header: finalColumns });

  // Set column widths for better readability
  const columnWidths = finalColumns.map(col => {
    if (col === '학교명') return { wch: 15 };
    if (col === '제출자 이메일') return { wch: 25 };
    if (col === '제출자 이름') return { wch: 12 };
    if (col === '유저 가입일') return { wch: 12 };
    if (col === '제출일') return { wch: 18 };
    if (col === '주차') return { wch: 20 };
    if (col === '미션명') return { wch: 20 };
    if (col === '제목') return { wch: 30 };
    if (col.includes('회차:')) return { wch: 50 }; // Question columns
    if (col === '기존 내용') return { wch: 50 };
    return { wch: 12 };
  });

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
