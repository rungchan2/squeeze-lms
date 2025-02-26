import crypto from 'crypto';

// 환경 변수 검증 (클라이언트와 서버 모두 지원)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY) {
  console.error('암호화 키가 설정되지 않았습니다.');
  throw new Error('NEXT_PUBLIC_ENCRYPTION_KEY environment variable is required');
}

const IV_LENGTH = 16; // AES 블록 크기

// 키 길이 검증 및 패딩 추가
function normalizeKey(key: string): Buffer {
  // 키가 hex string인 경우 처리
  const isHex = /^[0-9a-fA-F]+$/.test(key);
  const keyBuffer = (key.length === 64 && isHex) ? Buffer.from(key, 'hex') : Buffer.from(key);
  
  if (keyBuffer.length < 32) {
    // 키가 짧으면 랜덤 패딩
    return Buffer.concat([keyBuffer, crypto.randomBytes(32 - keyBuffer.length)]);
  } else if (keyBuffer.length > 32) {
    // 키가 길면 자르기
    return keyBuffer.subarray(0, 32);
  }
  return keyBuffer;
}

export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const normalizedKey = normalizeKey(ENCRYPTION_KEY);
  const cipher = crypto.createCipheriv('aes-256-cbc', normalizedKey, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // 메모리 보안을 위해 키 지우기
  normalizedKey.fill(0);
  
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
  try {
    // 입력값 검증
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    // ':' 구분자 검증
    if (!text.includes(':')) {
      throw new Error('Invalid encrypted format: missing separator');
    }

    const [ivHex, encryptedHex] = text.split(':');
    
    // IV와 암호화된 데이터 검증
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted format: missing IV or encrypted data');
    }

    // hex 문자열 검증
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
      throw new Error('Invalid hex format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const normalizedKey = normalizeKey(ENCRYPTION_KEY);

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', normalizedKey, iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // 메모리 보안을 위해 키 지우기
    normalizedKey.fill(0);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}