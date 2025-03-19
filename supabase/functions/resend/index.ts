// @deno-types

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  from?: string;
}

const handler = async (request: Request): Promise<Response> => {
  try {
    // 요청이 POST 메서드가 아닌 경우 에러 응답 반환
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 요청 본문에서 이메일 정보 추출
    const { to, subject, html, from }: EmailRequest = await request.json();
    
    // 필수 파라미터 유효성 검사
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: to' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || 'onboarding@resend.dev',
        to,
        subject: subject || '이메일 알림',
        html: html || '<strong>스퀴즈 LMS에서 보낸 이메일입니다.</strong>',
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

Deno.serve(handler);