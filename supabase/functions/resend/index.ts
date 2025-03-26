// @deno-types

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  from?: string;
}

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Function "resend" up and running!');

Deno.serve(async (req) => {
  // OPTIONS 요청 처리 (브라우저의 preflight 요청용)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 요청이 POST 메서드가 아닌 경우 에러 응답 반환
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 요청 본문에서 이메일 정보 추출
    const { to, subject, html, from }: EmailRequest = await req.json();
    
    console.log('Resend 이메일 전송 요청:', { to, subject });
    
    // 필수 파라미터 유효성 검사
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || 'info@squeezeedu.com',
        to,
        subject: subject || '이메일 알림',
        html: html || '<strong>스퀴즈 LMS에서 보낸 이메일입니다.</strong>',
      }),
    });

    const data = await res.json();
    console.log('Resend API 응답:', data);

    // 응답 시 CORS 헤더 포함
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });
  } catch (error: unknown) {
    console.error('Resend 이메일 전송 오류:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    });
  }
});