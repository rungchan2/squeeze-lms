import { PostWithRelations } from "@/types";
import { AnswersData, EssayAnswer, MixedAnswer } from "@/types/missionQuestions";

export interface ExtractedText {
  postId: string;
  userId: string;
  weekId: string;
  missionId: string;
  extractedContent: string;
  originalAnswers: (EssayAnswer | MixedAnswer)[];
  extractedAt: string;
}

export function extractEssayTextsFromPosts(posts: PostWithRelations[]): ExtractedText[] {
  const extractedTexts: ExtractedText[] = [];

  posts.forEach(post => {
    try {
      const answersData = post.answers_data as AnswersData | null;
      
      // Modern mission system (structured answers)
      if (answersData?.answers) {
        const essayAnswers = answersData.answers.filter(
          answer => answer.answer_type === 'essay' || answer.answer_type === 'mixed'
        ) as (EssayAnswer | MixedAnswer)[];

        if (essayAnswers.length > 0) {
          const combinedText = essayAnswers
            .map(answer => cleanHtmlTags(answer.answer_text || ''))
            .filter(text => text.trim().length > 0)
            .join(' ');

          if (combinedText.trim()) {
            extractedTexts.push({
              postId: post.id,
              userId: post.user_id,
              weekId: post.journey_mission_instances?.journey_week_id || '',
              missionId: post.journey_mission_instances?.missions?.id || '',
              extractedContent: combinedText.trim(),
              originalAnswers: essayAnswers,
              extractedAt: new Date().toISOString(),
            });
          }
        }
      }
      // Legacy system fallback (content field)
      else if (post.content && post.content.trim()) {
        const missionType = post.journey_mission_instances?.missions?.mission_type;
        
        // Only process if it's an essay-type mission
        if (missionType === 'essay' || !missionType) {
          extractedTexts.push({
            postId: post.id,
            userId: post.user_id,
            weekId: post.journey_mission_instances?.journey_week_id || '',
            missionId: post.journey_mission_instances?.missions?.id || '',
            extractedContent: cleanLegacyContent(post.content),
            originalAnswers: [],
            extractedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to extract text from post ${post.id}:`, error);
    }
  });

  return extractedTexts;
}

export function cleanHtmlTags(htmlContent: string): string {
  // Remove HTML tags but preserve content
  let cleaned = htmlContent
    // Convert HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up common patterns from rich text editors
    .replace(/&lt;답변&gt;\s*:/g, '') // Remove answer markers
    .replace(/^\d+\.\s*/gm, '') // Remove question numbers
    .replace(/^(Q:|질문:|문제:|답변:)\s*/gmi, '') // Remove Q&A markers
    .replace(/^[-*]\s*/gm, '') // Remove bullet points
    
    // Clean up whitespace
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n+/g, ' ') // Multiple newlines to single space
    .trim();

  return cleaned;
}

export function cleanLegacyContent(content: string): string {
  // For legacy content, apply similar cleaning
  return cleanHtmlTags(content);
}

export function combineTextsForAnalysis(extractedTexts: ExtractedText[]): string {
  return extractedTexts
    .map(item => item.extractedContent)
    .join(' ')
    .trim();
}

export function groupTextsByWeek(extractedTexts: ExtractedText[]): Record<string, ExtractedText[]> {
  return extractedTexts.reduce((groups, text) => {
    const weekId = text.weekId;
    if (!groups[weekId]) {
      groups[weekId] = [];
    }
    groups[weekId].push(text);
    return groups;
  }, {} as Record<string, ExtractedText[]>);
}

export function groupTextsByUser(extractedTexts: ExtractedText[]): Record<string, ExtractedText[]> {
  return extractedTexts.reduce((groups, text) => {
    const userId = text.userId;
    if (!groups[userId]) {
      groups[userId] = [];
    }
    groups[userId].push(text);
    return groups;
  }, {} as Record<string, ExtractedText[]>);
}

export function filterTextsByMinLength(
  extractedTexts: ExtractedText[], 
  minLength: number = 10
): ExtractedText[] {
  return extractedTexts.filter(text => 
    text.extractedContent.length >= minLength
  );
}

export function getTextStatistics(extractedTexts: ExtractedText[]) {
  const totalTexts = extractedTexts.length;
  const totalCharacters = extractedTexts.reduce(
    (sum, text) => sum + text.extractedContent.length, 
    0
  );
  const averageLength = totalTexts > 0 ? totalCharacters / totalTexts : 0;
  
  const uniqueUsers = new Set(extractedTexts.map(text => text.userId)).size;
  const uniqueWeeks = new Set(extractedTexts.map(text => text.weekId)).size;
  const uniqueMissions = new Set(extractedTexts.map(text => text.missionId)).size;

  return {
    totalTexts,
    totalCharacters,
    averageLength: Math.round(averageLength),
    uniqueUsers,
    uniqueWeeks,
    uniqueMissions,
  };
}