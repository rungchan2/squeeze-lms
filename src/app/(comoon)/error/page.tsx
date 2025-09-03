"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { MdError, MdWarning, MdInfo } from "react-icons/md";
import { useEffect, useState } from "react";

type ErrorType = "error" | "warning" | "info";

const getErrorDetails = (message: string): {
  type: ErrorType;
  title: string;
  description: string;
  icon: React.ReactNode;
} => {
  // Map common error messages to user-friendly versions
  const errorMap: Record<string, { type: ErrorType; title: string; description: string }> = {
    "로그인 정보가 없거나 유효하지 않습니다": {
      type: "error",
      title: "인증 오류",
      description: "로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.",
    },
    "로그인 정보를 확인하는 중 오류가 발생했습니다": {
      type: "error",
      title: "시스템 오류",
      description: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    },
    "회원가입 중 오류가 발생했습니다": {
      type: "error",
      title: "회원가입 실패",
      description: "회원가입 처리 중 문제가 발생했습니다. 입력 정보를 확인하고 다시 시도해 주세요.",
    },
    "복호화된 데이터가 없습니다": {
      type: "error",
      title: "데이터 오류",
      description: "세션이 만료되었거나 손상되었습니다. 다시 로그인해 주세요.",
    },
  };

  const details = errorMap[message] || {
    type: "warning" as ErrorType,
    title: "알 수 없는 오류",
    description: message || "예기치 않은 오류가 발생했습니다.",
  };

  const iconMap = {
    error: <MdError size={48} color="var(--negative-500)" />,
    warning: <MdWarning size={48} color="var(--warning-500)" />,
    info: <MdInfo size={48} color="var(--primary-500)" />,
  };

  return {
    ...details,
    icon: iconMap[details.type],
  };
};

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<ReturnType<typeof getErrorDetails> | null>(null);

  useEffect(() => {
    const message = searchParams.get("message") || "";
    setErrorDetails(getErrorDetails(decodeURIComponent(message)));
  }, [searchParams]);

  if (!errorDetails) {
    return null;
  }

  return (
    <ErrorContainer>
      <ErrorCard>
        <IconWrapper $type={errorDetails.type}>
          {errorDetails.icon}
        </IconWrapper>

        <Heading level={3}>{errorDetails.title}</Heading>

        <Text 
          variant="body" 
          color="var(--grey-600)" 
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          {errorDetails.description}
        </Text>

        <ButtonGroup>
          <Button 
            variant="outline" 
            onClick={() => router.push("/login")}
          >
            로그인 페이지로
          </Button>
          <Button 
            variant="flat" 
            onClick={() => router.push("/")}
          >
            홈으로 가기
          </Button>
        </ButtonGroup>
      </ErrorCard>
    </ErrorContainer>
  );
}

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 20px;
`;

const ErrorCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 500px;
  width: 100%;
  padding: 48px 32px;
  background-color: var(--white);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--grey-200);
`;

const IconWrapper = styled.div<{ $type: ErrorType }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 88px;
  height: 88px;
  background-color: ${({ $type }) => {
    switch ($type) {
      case "error":
        return "var(--negative-50)";
      case "warning":
        return "var(--warning-50)";
      case "info":
        return "var(--primary-50)";
      default:
        return "var(--grey-100)";
    }
  }};
  border-radius: 50%;
  margin-bottom: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;

  button {
    flex: 1;
  }
`;