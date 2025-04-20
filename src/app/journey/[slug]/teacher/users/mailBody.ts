export function mailBody(jourenyName: string, uuid: string) {
  return `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #f0f0f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
              <img src="${
                window.location.origin
              }/logo.svg" alt="스퀴즈 로고" style="height: 40px; margin-bottom: 10px;" />
              <h1 style="color: #333; font-size: 24px; margin: 0;">클라스 초대</h1>
            </div>
            
            <div style="margin-bottom: 30px; text-align: center; line-height: 1.6;">
              <p style="font-size: 16px; color: #333; margin-bottom: 16px;">안녕하세요, <strong>${
                jourenyName
              }</strong>에 초대되었습니다.</p>
              <p style="font-size: 16px; color: #333; margin-bottom: 25px;">아래 버튼을 클릭하여 여정에 참여해주세요.</p>
              
              <a href="${
                window.location.origin
              }/journey/${uuid}/redirect/invite" 
                 style="display: inline-block; padding: 12px 24px; background-color: #6366F1; color: white; text-decoration: none; font-weight: 500; border-radius: 6px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);">
                ${jourenyName} 시작하기
              </a>
            </div>
            
            <div style="color: #888; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              <p>이 메일은 발신 전용이며, 문의사항은 웹사이트를 통해 문의해주세요.</p>a
              <p>© ${new Date().getFullYear()} 스퀴즈. All rights reserved.</p>
            </div>
          </div>`;
}
