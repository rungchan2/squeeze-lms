'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useRouter, useSearchParams } from 'next/navigation';
import { user } from '@/utils/data/user';
import { toaster } from '@/components/ui/toaster';
import { createClient } from '@/utils/supabase/client';
import { Box } from '@chakra-ui/react';

export default function ForgotPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');
  
  // UUID 유효성 검사
  useEffect(() => {
    async function validateUuid() {
      if (!uuid) {
        setError('유효하지 않은 접근입니다');
        router.push('/login');
        return;
      }
      
      setIsValidating(true);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', uuid)
          .single();
        
        if (error || !data) {
          setError('유효하지 않은 사용자입니다');
          router.push('/login');
        }
      } catch (error) {
        console.error('UUID 검증 오류:', error);
        router.push('/login');
      } finally {
        setIsValidating(false);
      }
    }
    
    validateUuid();
  }, [uuid, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 비밀번호 업데이트
      const { error } = await user.updatePassword(password);
      
      if (error) {
        throw error;
      }
      
      toaster.create({
        title: '비밀번호가 성공적으로 변경되었습니다',
        type: 'success',
      });
      
      router.push('/login');
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setError('비밀번호 변경 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isValidating) {
    return (
      <Container>
        <Card>
          <h2>사용자 정보 확인 중...</h2>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container>
      <Card>
        <h2>비밀번호 재설정</h2>
        
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="password">새 비밀번호</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
            />
          </InputGroup>
          
          <InputGroup>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
            />
          </InputGroup>
          
          {error && <ErrorText>{error}</ErrorText>}
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : '비밀번호 변경'}
          </Button>
        </form>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
  background-color: var(--grey-100);
`;

const Card = styled(Box)`
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 24px;
    text-align: center;
    color: var(--primary);
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--grey-700);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--grey-300);
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: var(--grey-400);
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  color: var(--negative-500);
  font-size: 0.9rem;
  margin: 0;
`;
