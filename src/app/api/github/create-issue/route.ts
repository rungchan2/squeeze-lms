import { NextResponse } from 'next/server';

type BugType = "bug-low" | "bug-mid" | "bug-serious";

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

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const { title, body, bugType } = await request.json();
    
    // 서버 측에서 안전하게 GitHub 토큰 접근
    const TOKEN = process.env.GITHUB_TOKEN;
    
    if (!TOKEN) {
      console.error("GitHub 토큰이 설정되지 않았습니다. 환경 변수 GITHUB_TOKEN을 확인하세요.");
      return NextResponse.json({ 
        success: false, 
        error: 'GitHub 토큰이 설정되지 않았습니다.' 
      }, { status: 500 });
    }
    
    // 이슈 생성 API 엔드포인트
    const url = 'https://api.github.com/repos/rungchan2/squeeze-lms/issues';
    
    // 헤더 설정
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `token ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
    
    // API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        body: createIssueBody(body, bugType),
        labels: [bugType],
        assignees: ["rungchan2"]
      })
    });

    // 응답 처리
    const data = await response.json();
    
    if (response.ok) {
      console.log(`이슈가 생성되었습니다: ${data.html_url}`);
      return NextResponse.json({ success: true, data });
    } else {
      console.error(`API 오류: ${response.status}`, data);
      return NextResponse.json({ 
        success: false, 
        error: data.message, 
        status: response.status 
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('이슈 생성 중 오류 발생:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 