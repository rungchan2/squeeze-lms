// Octokit 대신 fetch API 사용
type BugType = "bug-low" | "bug-mid" | "bug-serious";

// GitHub 토큰 - 브라우저 환경에서 process.env가 제대로 작동하지 않을 수 있음
// 테스트를 위한 임시 값 (배포 시 제거 필요)
const DEFAULT_TOKEN = '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';

// 인증 헤더 출력 (디버깅 용도)
console.log('============ GitHub 토큰 형식 확인 ============');
console.log('토큰 시작 부분:', DEFAULT_TOKEN?.substring(0, 5) + '...');
console.log('process.env.GITHUB_TOKEN 존재 여부:', !!process.env.GITHUB_TOKEN);
console.log('===================================================');

/**
 * GitHub API 요청을 위한 기본 헤더
 */
const getGitHubHeaders = () => {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${DEFAULT_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
};

/**
 * GitHub 인증 상태 확인
 * @returns 인증 성공 여부 (true/false)
 */
export const checkGitHubAuth = async () => {
  try {
    console.log("GitHub 인증 상태 확인 중...");
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: getGitHubHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`GitHub API에 인증됨: ${data.login}`);
    return { success: true, username: data.login };
  } catch (error: any) {
    console.error("GitHub 인증 실패:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 버그 타입에 따른 이슈 본문 템플릿 생성
 */
const createIssueBody = (description: string, bugType: BugType): string => {
  const bugSeverity = {
    'bug-low': '낮음 (사소한 문제)',
    'bug-mid': '중간 (조금 불편함)',
    'bug-serious': '높음 (심각함)'
  }[bugType];

  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

  return `## 버그 설명
${description}

## 심각도
${bugSeverity}

## 추가 정보
- 보고일: ${now}
- 연관 레이블: ${bugType}
`;
};

/**
 * GitHub 이슈를 생성하는 함수 
 * 토큰을 직접 사용하여 인증 문제 해결
 */
export const createIssue = async (
  title: string, 
  body: string, 
  bugType: BugType
) => {
  try {
    // 이슈 생성 API 엔드포인트
    const url = 'https://api.github.com/repos/rungchan2/squeeze-lms/issues';
    
    // 헤더 설정 - 토큰 직접 사용
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `token ${DEFAULT_TOKEN}`, 
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
    
    // API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        body,
        labels: [bugType],
        assignees: ["rungchan2"]
      })
    });

    // 응답 처리
    const data = await response.json();
    
    if (response.ok) {
      console.log(`이슈가 생성되었습니다: ${data.html_url}`);
      return { success: true, data };
    } else {
      console.error(`API 오류: ${response.status}`, data);
      return { success: false, error: data.message, status: response.status };
    }
  } catch (error: any) {
    console.error('이슈 생성 중 오류 발생:', error);
    return { success: false, error: error.message };
  }
};
