// Octokit 대신 fetch API 사용
type BugType = "bug-low" | "bug-mid" | "bug-serious";

/**
 * GitHub 이슈를 생성하는 함수 - 서버 API 라우트 호출
 */
export const createIssue = async (
  title: string, 
  body: string, 
  bugType: BugType
) => {
  try {
    console.log("GitHub 이슈 생성 API 호출 중...");
    
    // API 라우트 호출
    const response = await fetch('/api/github/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        bugType
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`이슈가 생성되었습니다: ${result.data.html_url}`);
      return { success: true, data: result.data };
    } else {
      console.error(`API 오류: ${response.status}`, result);
      return { success: false, error: result.error, status: response.status };
    }
  } catch (error: any) {
    console.error('이슈 생성 중 오류 발생:', error);
    return { success: false, error: error.message };
  }
};
