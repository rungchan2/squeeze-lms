"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Table, Box } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { FaUsers, FaTimes } from "react-icons/fa";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import Text from "@/components/Text/Text";
import Button from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { usePosts } from "@/hooks/usePosts";
import { useWeeks } from "@/hooks/useWeeks";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import { useQuestionsByIds } from "@/hooks/useQuestionsByIds";
import { PostWithRelations } from "@/types";
import { toaster } from "@/components/ui/toaster";
import { exportStudentSubmissionsToExcel } from "@/utils/excel/exportStudentSubmissions";
import dayjs from "@/utils/dayjs/dayjs";
import { excludeHtmlTags } from "@/utils/utils";

interface StudentSubmissionMatrixProps {
  slug: string;
}

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
  columnKey: string; // e.g., "1-1", "1-2"
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

// Component to show truncated question text with "더보기" toggle
function QuestionTextWithToggle({ questionText }: { questionText: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 100;

  const shouldTruncate = questionText.length > MAX_LENGTH;
  const displayText = shouldTruncate && !isExpanded
    ? questionText.substring(0, MAX_LENGTH) + '...'
    : questionText;

  return (
    <div className="question-text">
      질문: {displayText}
      {shouldTruncate && (
        <ToggleButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '접기' : '더보기'}
        </ToggleButton>
      )}
    </div>
  );
}

export default function StudentSubmissionMatrix({ slug }: StudentSubmissionMatrixProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Handle cell hover
  const handleCellHover = useCallback((rowIndex: number, colIndex: number) => {
    setHoveredCell({ row: rowIndex, col: colIndex });
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Fetch all posts for this journey
  const {
    data: allPosts,
    isLoading: postsLoading,
  } = usePosts(1000, slug, true); // Get all posts

  // Fetch weeks
  const { weeks = [], isLoading: weeksLoading } = useWeeks(slug) || {};

  // Fetch mission instances
  const { missionInstances = [], isLoading: missionInstancesLoading } =
    useJourneyMissionInstances(slug) || {};

  // Extract all unique question IDs from posts' answers_data
  const allQuestionIds = useMemo(() => {
    const ids = new Set<string>();
    allPosts.forEach((post: PostWithRelations) => {
      if (post.answers_data) {
        let parsedData;
        try {
          parsedData = typeof post.answers_data === 'string'
            ? JSON.parse(post.answers_data)
            : post.answers_data;
        } catch {
          return;
        }
        if (parsedData.answers && Array.isArray(parsedData.answers)) {
          parsedData.answers.forEach((answer: any) => {
            if (answer.question_id) {
              ids.add(answer.question_id);
            }
          });
        }
      }
    });
    return Array.from(ids);
  }, [allPosts]);

  // Fetch all questions by their IDs
  const { questions: fetchedQuestions = [], isLoading: questionsLoading } =
    useQuestionsByIds(allQuestionIds);

  // Create a map from question ID to question data
  const questionsMap = useMemo(() => {
    const map = new Map<string, { questionText: string; questionType: string }>();
    fetchedQuestions.forEach((q: any) => {
      map.set(q.id, {
        questionText: q.question_text || '',
        questionType: q.question_type || 'essay',
      });
    });
    return map;
  }, [fetchedQuestions]);

  // Build question columns ordered by week_number
  const questionColumns = useMemo<WeekQuestionColumn[]>(() => {
    if (!weeks.length || !missionInstances.length) return [];

    const columns: WeekQuestionColumn[] = [];
    const seenQuestionIds = new Set<string>(); // Track already added questions

    // Sort weeks by week_number
    const sortedWeeks = [...weeks].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));

    // For each week, gather questions
    sortedWeeks.forEach(week => {
      // Find mission instances for this week
      const weekMissionInstances = missionInstances.filter(mi => mi.journey_week_id === week.id);

      let questionIndex = 1;
      weekMissionInstances.forEach(mi => {
        // Get questions for this mission from posts' answers_data
        const questionsForMission = getQuestionsFromPosts(allPosts, mi.id);

        questionsForMission.forEach(q => {
          // Skip if question already added (avoid duplicates)
          if (seenQuestionIds.has(q.questionId)) return;
          seenQuestionIds.add(q.questionId);

          // Look up the actual question text from questionsMap (fetched from mission_questions table)
          const fetchedQuestion = questionsMap.get(q.questionId);
          const actualQuestionText = fetchedQuestion?.questionText || q.questionText || `질문 ${questionIndex}`;
          const actualQuestionType = fetchedQuestion?.questionType || q.questionType || 'essay';

          // Use questionId for unique key instead of index
          const columnKey = `${week.week_number || 0}-${questionIndex}`;
          columns.push({
            weekNumber: week.week_number || 0,
            weekId: week.id,
            weekName: week.name,
            missionId: mi.mission_id,
            missionName: mi.mission?.name || '',
            questionOrder: q.questionOrder,
            questionId: q.questionId,
            questionText: actualQuestionText,
            questionType: actualQuestionType,
            columnKey,
          });
          questionIndex++;
        });
      });
    });

    return columns;
  }, [weeks, missionInstances, allPosts, questionsMap]);

  // Build student rows
  const studentRows = useMemo<StudentRow[]>(() => {
    if (!allPosts.length) return [];

    // Get unique students from posts
    const studentMap = new Map<string, StudentRow>();

    allPosts.forEach((post: PostWithRelations) => {
      if (!post.profiles) return;

      const userId = post.profiles.id;

      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          userId,
          email: post.profiles.email || '',
          firstName: post.profiles.first_name || '',
          lastName: post.profiles.last_name || '',
          fullName: `${post.profiles.last_name || ''}${post.profiles.first_name || ''}`,
          organizationName: post.profiles.organizations?.name || '',
          createdAt: post.profiles.created_at || '',
          answers: new Map(),
        });
      }

      // Parse answers from this post
      const student = studentMap.get(userId)!;
      if (post.answers_data) {
        let parsedData;
        try {
          parsedData = typeof post.answers_data === 'string'
            ? JSON.parse(post.answers_data)
            : post.answers_data;
        } catch {
          return;
        }

        if (parsedData.answers && Array.isArray(parsedData.answers)) {
          parsedData.answers.forEach((answer: any) => {
            // Find the column for this question
            const column = questionColumns.find(col => col.questionId === answer.question_id);
            if (column) {
              // Use questionId as key for answers map
              student.answers.set(answer.question_id, {
                answer: formatAnswerForDisplay(answer),
                submittedAt: post.created_at,
              });
            }
          });
        }
      }
    });

    // Sort students by name
    return Array.from(studentMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }, [allPosts, questionColumns]);

  // Export to Excel
  const handleExportToExcel = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      toaster.create({
        title: "Excel 파일을 생성하는 중입니다...",
        type: "loading",
      });

      await exportStudentSubmissionsToExcel({
        students: studentRows,
        columns: questionColumns,
        journeyName: slug,
      });

      toaster.create({
        title: "Excel 파일이 다운로드되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toaster.create({
        title: "Excel 파일 내보내기에 실패했습니다.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = postsLoading || weeksLoading || missionInstancesLoading || questionsLoading;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container>
      {/* Header */}
      <HeaderSection>
        <HeaderInfo>
          <TitleRow>
            <FaUsers size={20} color="var(--primary-600)" />
            <Text variant="body" fontWeight="bold" style={{ fontSize: "18px" }}>
              학생별 제출 현황
            </Text>
          </TitleRow>
          <StatsRow>
            <StatBadge>
              <span>{studentRows.length}</span>명의 학생
            </StatBadge>
            <StatBadge>
              <span>{questionColumns.length}</span>개의 질문
            </StatBadge>
          </StatsRow>
        </HeaderInfo>
        <Button
          variant="outline"
          onClick={handleExportToExcel}
          disabled={isExporting || studentRows.length === 0}
        >
          <HiOutlineDocumentDownload />
          Excel 내보내기
        </Button>
      </HeaderSection>

      {/* Matrix Table */}
      <TableWrapper>
        <MatrixTable>
          <thead>
            <tr>
              <StickyHeader className="student-info">이름</StickyHeader>
              {questionColumns.map((col, colIndex) => (
                <QuestionHeader
                  key={col.questionId}
                  data-col-index={colIndex}
                  isHighlighted={hoveredCell?.col === colIndex}
                >
                  <div className="week-info">{col.weekNumber}주차 - {col.weekName}</div>
                  <div className="question-number">질문 {col.columnKey}</div>
                  <QuestionTextWithToggle questionText={excludeHtmlTags(col.questionText)} />
                </QuestionHeader>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentRows.map((student, rowIndex) => (
              <tr key={student.userId}>
                <StickyCell
                  className="student-info"
                  isHighlighted={hoveredCell?.row === rowIndex}
                >
                  {student.fullName}
                </StickyCell>
                {questionColumns.map((col, colIndex) => {
                  const answerData = student.answers.get(col.questionId);
                  const isRowHighlighted = hoveredCell?.row === rowIndex;
                  const isColHighlighted = hoveredCell?.col === colIndex;
                  return (
                    <AnswerCell
                      key={col.questionId}
                      hasAnswer={!!answerData}
                      isHighlighted={isRowHighlighted || isColHighlighted}
                      onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                      onMouseLeave={handleCellLeave}
                    >
                      {answerData ? (
                        <AnswerContent>
                          <span className="answer-text">
                            {formatMultipleQuestionAnswer(excludeHtmlTags(answerData.answer))}
                          </span>
                        </AnswerContent>
                      ) : (
                        <NoAnswer>
                          <FaTimes color="#c62828" size={14} />
                          <span>미제출</span>
                        </NoAnswer>
                      )}
                    </AnswerCell>
                  );
                })}
              </tr>
            ))}
            {studentRows.length === 0 && (
              <tr>
                <EmptyCell colSpan={1 + questionColumns.length}>
                  <EmptyState>
                    <FaUsers size={32} color="var(--grey-400)" />
                    <Text variant="body" color="var(--grey-500)">
                      제출된 과제가 없습니다
                    </Text>
                  </EmptyState>
                </EmptyCell>
              </tr>
            )}
          </tbody>
        </MatrixTable>
      </TableWrapper>
    </Container>
  );
}

// Helper functions
function getQuestionsFromPosts(posts: PostWithRelations[], missionInstanceId: string) {
  const questionsMap = new Map<string, { questionId: string; questionOrder: number; questionText: string; questionType: string }>();

  posts
    .filter(post => (post as any).mission_instance_id === missionInstanceId)
    .forEach(post => {
      if (post.answers_data) {
        let parsedData;
        try {
          parsedData = typeof post.answers_data === 'string'
            ? JSON.parse(post.answers_data)
            : post.answers_data;
        } catch {
          return;
        }

        if (parsedData.answers && Array.isArray(parsedData.answers)) {
          parsedData.answers.forEach((answer: any) => {
            if (!questionsMap.has(answer.question_id)) {
              questionsMap.set(answer.question_id, {
                questionId: answer.question_id,
                questionOrder: answer.question_order,
                questionText: answer.question_text || `질문 ${answer.question_order}`,
                questionType: answer.answer_type,
              });
            }
          });
        }
      }
    });

  return Array.from(questionsMap.values()).sort((a, b) => a.questionOrder - b.questionOrder);
}

function formatAnswerForDisplay(answer: any): string {
  switch (answer.answer_type) {
    case 'essay':
      return answer.answer_text || '답변 없음';
    case 'multiple_choice':
      return answer.selected_option || '선택 없음';
    case 'image_upload':
      const imageCount = answer.image_urls?.length || 0;
      return answer.answer_text
        ? `${answer.answer_text} (이미지 ${imageCount}개)`
        : `이미지 ${imageCount}개`;
    case 'mixed':
      const mixedImageCount = answer.image_urls?.length || 0;
      if (answer.answer_text && mixedImageCount > 0) {
        return `${answer.answer_text} (이미지 ${mixedImageCount}개)`;
      }
      return answer.answer_text || `이미지 ${mixedImageCount}개`;
    default:
      return '알 수 없는 형식';
  }
}

// Format answers that contain multiple questions with line breaks
function formatMultipleQuestionAnswer(text: string): React.ReactNode {
  if (!text) return text;

  // Split by patterns like "1.", "2.", "답변 :", "답변:", "질문:"
  // Add line break before numbered questions (1., 2., etc.) and "답변" keywords
  const formatted = text
    .replace(/(\d+\.)\s*/g, '\n$1 ')  // Add newline before "1.", "2.", etc.
    .replace(/(답변\s*:)/g, '\n$1')    // Add newline before "답변 :" or "답변:"
    .trim();

  // Split by newlines and render with <br /> tags
  const lines = formatted.split('\n').filter(line => line.trim());

  return lines.map((line, index) => (
    <span key={index}>
      {index > 0 && <br />}
      {line}
    </span>
  ));
}

function getQuestionTypeKorean(type: string): string {
  switch (type) {
    case 'essay':
      return '서술';
    case 'multiple_choice':
      return '객관';
    case 'image_upload':
      return '이미지';
    case 'mixed':
      return '혼합';
    default:
      return type;
  }
}


// Styled Components
const Container = styled.div`
  padding: 0;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--grey-100);
  border-radius: 20px;
  font-size: 13px;
  color: var(--grey-700);

  span {
    font-weight: 600;
    color: var(--primary-600);
  }
`;

const TableWrapper = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  overflow: auto;
  max-height: 175vh;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MatrixTable = styled.table`
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--grey-50);
  }

  tbody tr:hover {
    background: var(--grey-25);
  }
`;

const StickyHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--grey-700);
  border-bottom: 2px solid var(--grey-200);
  border-right: 2px solid var(--grey-300);
  background: var(--grey-100);
  white-space: nowrap;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 40;
  min-width: 120px;
`;

const QuestionHeader = styled.th<{ isHighlighted?: boolean }>`
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  color: var(--grey-700);
  border-bottom: 2px solid var(--grey-200);
  border-right: 1px solid var(--grey-200);
  background: ${props => props.isHighlighted ? 'rgba(255, 152, 0, 0.05)' : 'var(--grey-50)'};
  min-width: 300px;
  max-width: 400px;
  vertical-align: top;
  transition: background 0.15s ease;

  .week-info {
    font-weight: 700;
    font-size: 16px;
    color: #f57c00;
    margin-bottom: 8px;
  }

  .question-number {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-600);
    margin-bottom: 6px;
  }

  .question-text {
    font-size: 13px;
    color: var(--grey-700);
    font-weight: 400;
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.5;
  }
`;

const StickyCell = styled.td<{ isHighlighted?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid var(--grey-100);
  border-right: 2px solid var(--grey-300);
  white-space: nowrap;
  background: ${props => props.isHighlighted ? '#fff9f0' : 'var(--grey-50)'};
  position: sticky;
  left: 0;
  z-index: 15;
  font-weight: 500;
  min-width: 120px;
  transition: background 0.15s ease;
`;

const AnswerCell = styled.td<{ hasAnswer: boolean; isHighlighted?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid var(--grey-100);
  border-right: 1px solid var(--grey-100);
  text-align: left;
  vertical-align: top;
  background: ${props => {
    if (props.isHighlighted) return 'rgba(255, 152, 0, 0.05)';
    return props.hasAnswer ? 'white' : '#ffebee';
  }};
  min-width: 300px;
  max-width: 400px;
  transition: background 0.15s ease;
  cursor: pointer;
`;

const AnswerContent = styled.div`
  .answer-text {
    font-size: 13px;
    color: var(--grey-700);
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
`;

const NoAnswer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c62828;
  font-size: 13px;
  font-weight: 500;
`;

const EmptyCell = styled.td`
  padding: 40px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  margin-left: 4px;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--primary-50);
    text-decoration: underline;
  }
`;
