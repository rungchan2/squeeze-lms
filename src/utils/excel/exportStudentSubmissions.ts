import * as XLSX from 'xlsx';
import dayjs from '@/utils/dayjs/dayjs';
import { excludeHtmlTags } from '@/utils/utils';

interface WeekQuestionColumn {
  weekNumber: number;
  weekId: string;
  weekName: string;
  missionId: string;
  missionName: string;
  questionOrder: number;
  questionId: string;
  questionText: string;
  questionType: string;
  columnKey: string;
}

interface StudentRow {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  organizationName: string;
  createdAt: string;
  answers: Map<string, { answer: string; submittedAt: string }>;
}

interface ExportStudentSubmissionsData {
  students: StudentRow[];
  columns: WeekQuestionColumn[];
  journeyName: string;
}

export const exportStudentSubmissionsToExcel = async (data: ExportStudentSubmissionsData) => {
  const { students, columns, journeyName } = data;

  // Build header row - simplified to just "이름"
  const baseHeaders = ['이름'];

  // Build question column headers matching UI format:
  // "N주차 - 주차명 | 질문 N-n | 질문내용"
  const questionHeaders = columns.map(col => {
    const cleanQuestionText = excludeHtmlTags(col.questionText);
    return `${col.weekNumber}주차 - ${col.weekName} | 질문 ${col.columnKey} | ${cleanQuestionText}`;
  });

  const allHeaders = [...baseHeaders, ...questionHeaders];

  // Build data rows - one row per student
  const excelData = students.map(student => {
    const row: Record<string, any> = {
      '이름': student.fullName,
    };

    // Add each question column
    columns.forEach((col, index) => {
      const headerKey = questionHeaders[index];
      const answerData = student.answers.get(col.questionId);

      if (answerData) {
        // Clean HTML tags from answer text
        row[headerKey] = excludeHtmlTags(answerData.answer);
      } else {
        row[headerKey] = '미제출';
      }
    });

    return row;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData, { header: allHeaders });

  // Set column widths
  const columnWidths = allHeaders.map((header, index) => {
    if (index === 0) return { wch: 15 }; // 이름
    return { wch: 50 }; // 질문 컬럼들 (wider for longer headers)
  });

  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '학생별 제출 현황');

  // Generate filename
  const currentDate = dayjs().format('YYYY-MM-DD');
  const filename = `${journeyName}-학생별제출현황-${currentDate}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, filename);

  return filename;
};
