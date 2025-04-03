import { NextResponse } from 'next/server';
import dayjs from "@/utils/dayjs/dayjs";
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

type BugType = "bug-low" | "bug-mid" | "bug-serious";

/**
 * User-Agent 문자열에서 브라우저, 디바이스, OS 정보 추출
 */
function parseUserAgent(userAgent: string) {
  try {
    // 새 인스턴스 생성 시 new 키워드 필요
    const parser = new (UAParser as any)(userAgent);
    const browser = parser.getBrowser();
    const device = parser.getDevice();
    const os = parser.getOS();
    const cpu = parser.getCPU();

    return {
      browser: `${browser.name || '알 수 없음'} ${browser.version || ''}`.trim(),
      device: device.vendor 
        ? `${device.vendor} ${device.model} (${device.type || '알 수 없음'})`
        : '알 수 없음',
      os: `${os.name || '알 수 없음'} ${os.version || ''}`.trim(),
      cpu: cpu.architecture || '알 수 없음'
    };
  } catch (error) {
    console.error('User-Agent 파싱 오류:', error);
    return {
      browser: '알 수 없음',
      device: '알 수 없음',
      os: '알 수 없음',
      cpu: '알 수 없음'
    };
  }
}

/**
 * 버그 타입에 따른 이슈 본문 템플릿 생성
 */
const createIssueBody = (
  description: string, 
  bugType: BugType, 
  userInfo: {
    userAgent: string;
    ip: string;
    language: string;
    referer: string;
  }
): string => {
  const bugSeverity = {
    'bug-low': '낮음 (사소한 문제)',
    'bug-mid': '중간 (조금 불편함)',
    'bug-serious': '높음 (심각함)'
  }[bugType];

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // User-Agent 정보 파싱
  const { browser, device, os, cpu } = parseUserAgent(userInfo.userAgent);

  return `## 버그 설명
${description}

## 심각도
${bugSeverity}

## 사용자 환경 정보
- 브라우저: ${browser}
- 운영체제: ${os}
- 디바이스: ${device}
- CPU 아키텍처: ${cpu}
- 언어 설정: ${userInfo.language}
- 접속 IP: ${userInfo.ip}
- 참조 페이지: ${userInfo.referer || '직접 접속'}

## 추가 정보
- 보고일: ${now}
- 연관 레이블: ${bugType}
`;
};

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const { title, body, bugType } = await request.json();
    
    // 요청 헤더에서 사용자 정보 추출
    const headersList = headers();
    
    // 사용자 정보 수집
    const userInfo = {
      userAgent: (await headersList).get('user-agent') || '알 수 없음',
      ip: (await headersList).get('x-forwarded-for')?.split(',')[0].trim() || '알 수 없음',
      language: (await headersList).get('accept-language')?.split(',')[0] || '알 수 없음',
      referer: (await headersList).get('referer') || '알 수 없음'
    };
    
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
    const githubHeaders = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `token ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
    
    // API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers: githubHeaders,
      body: JSON.stringify({
        title,
        body: createIssueBody(body, bugType, userInfo),
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