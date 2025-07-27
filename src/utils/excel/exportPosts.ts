import * as XLSX from 'xlsx';
import { PostWithRelations } from '@/types';
import { excludeHtmlTags } from '@/utils/utils';
import dayjs from '@/utils/dayjs/dayjs';

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

export const exportPostsToExcel = (data: ExcelExportData) => {
  const { posts, journeyName, weeks, missionInstances } = data;

  // Create a mapping for week information
  const weekMap = new Map(weeks.map(week => [week.id, week]));
  
  // Create a mapping for mission instance to week
  const missionInstanceToWeekMap = new Map(
    missionInstances.map(instance => [instance.id, instance.journey_week_id])
  );

  // Transform posts data for Excel
  const excelData = posts.map(post => {
    // Get week information
    const missionInstanceId = (post as any).mission_instance_id;
    const weekId = missionInstanceToWeekMap.get(missionInstanceId);
    const week = weekId ? weekMap.get(weekId) : null;

    // Get mission information from journey_mission_instances
    const mission = post.journey_mission_instances?.missions;

    return {
      '학교명': post.profiles?.organizations?.name || '',
      '제출자 이메일': post.profiles?.email || '',
      '제출자 이름': post.profiles ? `${post.profiles.last_name || ''}${post.profiles.first_name || ''}` : '',
      '유저 가입일': post.profiles?.created_at ? dayjs(post.profiles.created_at).format('YYYY-MM-DD') : '',
      '제출일': dayjs(post.created_at).format('YYYY-MM-DD HH:mm:ss'),
      '주차': week ? `${week.week_number || ''}주차: ${week.name}` : '',
      '미션명': mission?.name || '',
      '제목': post.title,
      '내용': excludeHtmlTags(post.content || ''),
      '점수': post.score || 0,
      '팀 제출 여부': post.is_team_submission ? '팀 제출' : '개인 제출',
      '팀명': post.teamInfo?.name || '',
      '숨김 상태': post.is_hidden ? '숨김' : '공개',
      '조회수': post.view_count || 0,
    };
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