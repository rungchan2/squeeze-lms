"use client";

import { userLogout } from "@/utils/data/auth";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";
import { MdError } from "react-icons/md";

export default function AuthCodeError() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get('error');
  const error_description = params.get('error_description');

  const handleLogout = async () => {
    await userLogout();
    router.push("/login");
  };
  
  return (
    <ErrorContainer>
      <ErrorCard>
        <IconWrapper>
          <MdError size={48} color="var(--error-500)" />
        </IconWrapper>
        
        <Text variant="body" fontWeight="bold" color="var(--grey-800)" style={{ fontSize: '24px' }}>
          로그인 오류
        </Text>
        
        <Text variant="body" color="var(--grey-600)" style={{ textAlign: 'center' }}>
          로그인 중 문제가 발생했습니다. 다시 시도해주세요.
        </Text>
        
        {error && (
          <ErrorDetail>
            <Text variant="caption" fontWeight="bold" color="var(--error-700)">
              {error}
            </Text>
            
            {error_description && (
              <Text variant="caption" color="var(--grey-600)">
                {error_description}
              </Text>
            )}
          </ErrorDetail>
        )}
        
        <ButtonWrapper>
          
          <Button variant="outline" onClick={handleLogout}>
            로그인 페이지로 돌아가기
          </Button>
        </ButtonWrapper>
      </ErrorCard>
    </ErrorContainer>
  );
}

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 20px;
  background-color: var(--grey-100);
`;

const ErrorCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 450px;
  width: 100%;
  padding: 40px 24px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: var(--error-50);
  border-radius: 50%;
`;

const ErrorDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background-color: var(--error-50);
  border-radius: 8px;
  border-left: 4px solid var(--error-500);
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
`;
