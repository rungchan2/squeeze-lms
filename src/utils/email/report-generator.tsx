import { CustomWordGroup } from "@/components/statistics/CustomWordGroupEditor";
import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";

interface ReportData {
  journeyName: string;
  filters: {
    viewMode: string;
    selectedWeekIds: string[];
    timeRange: string;
  };
  wordFrequencyData: WordFrequencyResponse[];
  customGroups: CustomWordGroup[];
  apiGroups: CustomWordGroup[];
  weekNames: string[];
  generatedAt: string;
}

export function generateEmailHTML(data: ReportData): string {
  const {
    journeyName,
    filters,
    wordFrequencyData,
    customGroups,
    apiGroups,
    weekNames,
    generatedAt
  } = data;

  // Calculate statistics
  const totalWords = wordFrequencyData.reduce((sum, week) => {
    return sum + week.word_frequency.reduce((weekSum, [_, freq]) => weekSum + freq, 0);
  }, 0);

  const uniqueWords = new Set(
    wordFrequencyData.flatMap(week => week.word_frequency.map(([word]) => word))
  ).size;

  const allGroups = [...apiGroups, ...customGroups];

  // Calculate word group frequencies by week
  const calculateGroupFrequencyByWeek = () => {
    const groupFrequencies: { [groupId: string]: number[] } = {};
    
    // Initialize frequencies for each group
    allGroups.forEach(group => {
      groupFrequencies[group.id] = new Array(weekNames.length).fill(0);
    });

    // Calculate frequencies for each week
    wordFrequencyData.forEach((weekData, weekIndex) => {
      allGroups.forEach(group => {
        let groupTotal = 0;
        group.words.forEach(word => {
          const wordFreq = weekData.word_frequency.find(([w]) => w === word)?.[1] || 0;
          groupTotal += wordFreq;
        });
        groupFrequencies[group.id][weekIndex] = groupTotal;
      });
    });

    return groupFrequencies;
  };

  const groupFrequencies = calculateGroupFrequencyByWeek();

  // Generate word group HTML
  const generateWordGroupHTML = (group: CustomWordGroup) => {
    const badgeHTML = group.isApiGroup 
      ? '<span style="background: #E6F3FF; color: #0066CC; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">자동생성</span>' 
      : '';
    
    const wordsHTML = group.words.map(word => {
      const frequency = group.apiWordsData?.find(w => w.word === word)?.frequency || 0;
      return `<span style="background: #F5F5F5; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin: 2px;">${word} (${frequency})</span>`;
    }).join('');

    return `
      <div style="background: white; border: 1px solid #E0E0E0; border-left: 4px solid ${group.color}; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: ${group.color}; border-radius: 50%; margin-right: 8px;"></span>
          <strong>${group.name}</strong>${badgeHTML}
        </div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${group.words.length}개 단어 · 총 빈도 ${group.totalCount}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${wordsHTML}</div>
      </div>
    `;
  };

  // Generate week data table
  const generateWeekTableHTML = () => {
    const rows = weekNames.map((weekName, index) => {
      const weekData = wordFrequencyData[index];
      if (!weekData) return '';
      
      const topWords = weekData.word_frequency
        .slice(0, 5)
        .map(([word, freq]) => `${word}(${freq})`)
        .join(', ');
      
      const totalFreq = weekData.word_frequency.reduce((sum, [_, freq]) => sum + freq, 0);
      const uniqueCount = weekData.word_frequency.length;

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #E0E0E0;">${weekName}</td>
          <td style="padding: 8px; border: 1px solid #E0E0E0; text-align: center;">${uniqueCount}</td>
          <td style="padding: 8px; border: 1px solid #E0E0E0; text-align: center;">${totalFreq}</td>
          <td style="padding: 8px; border: 1px solid #E0E0E0; font-size: 12px; color: #666;">${topWords}</td>
        </tr>
      `;
    }).join('');

    return `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #F5F5F5;">
            <th style="padding: 8px; border: 1px solid #E0E0E0; text-align: left;">주차</th>
            <th style="padding: 8px; border: 1px solid #E0E0E0; text-align: center;">고유 단어</th>
            <th style="padding: 8px; border: 1px solid #E0E0E0; text-align: center;">총 빈도</th>
            <th style="padding: 8px; border: 1px solid #E0E0E0; text-align: left;">상위 5개 단어</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };



  // Generate complete HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${journeyName} - 학습 분석 보고서</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #F8F9FA; margin: 0; padding: 0;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="margin: 0 0 12px 0; color: #2D3748; font-size: 28px;">📊 학습 분석 보고서</h1>
          <h2 style="margin: 0 0 16px 0; color: #4A5568; font-size: 20px;">${journeyName}</h2>
          <div style="color: #718096; font-size: 14px;">
            <div>📅 분석 기간: ${weekNames.join(', ')}</div>
            <div>📋 분석 모드: ${filters.viewMode === 'individual' ? '개별 학생' : '전체 학생'}</div>
            <div>🕐 생성 시간: ${new Date(generatedAt).toLocaleString('ko-KR')}</div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 16px 0; color: #2D3748;">📈 요약 통계</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div style="background: #EDF2F7; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2D3748;">${weekNames.length}</div>
              <div style="font-size: 12px; color: #718096;">분석 주차</div>
            </div>
            <div style="background: #EDF2F7; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2D3748;">${uniqueWords}</div>
              <div style="font-size: 12px; color: #718096;">고유 단어</div>
            </div>
            <div style="background: #EDF2F7; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2D3748;">${totalWords}</div>
              <div style="font-size: 12px; color: #718096;">총 단어 빈도</div>
            </div>
            <div style="background: #EDF2F7; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2D3748;">${allGroups.length}</div>
              <div style="font-size: 12px; color: #718096;">단어 그룹</div>
            </div>
          </div>
        </div>

        <!-- Word Groups -->
        <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 16px 0; color: #2D3748;">🏷️ 단어 그룹 분석</h3>
          ${allGroups.map(generateWordGroupHTML).join('')}
        </div>

        <!-- Week by Week Analysis -->
        <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 16px 0; color: #2D3748;">📅 주차별 요약</h3>
          ${generateWeekTableHTML()}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; color: #718096; font-size: 12px;">
          <p>이 보고서는 Sqeeze LMS 학습 분석 시스템에서 자동으로 생성되었습니다.</p>
          <p>© ${new Date().getFullYear()} Sqeeze. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}