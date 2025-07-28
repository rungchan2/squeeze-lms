"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import styled from "@emotion/styled";
import { IoArrowBack } from "react-icons/io5";
import Text from "@/components/Text/Text";

interface BackButtonProps {
  /** 버튼에 표시할 텍스트 (기본값: "뒤로가기") */
  text?: string;
  /** 클릭 시 실행할 커스텀 함수 (기본값: router.back()) */
  onClick?: () => void;
  /** 조건부 렌더링을 위한 표시 여부 */
  show?: boolean;
  /** 추가 CSS 클래스명 */
  className?: string;
}

export default function BackButton({ 
  text = "뒤로가기", 
  onClick, 
  show = true,
  className 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      // 히스토리가 있는지 확인하고 뒤로가기 또는 홈으로 이동
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  }, [onClick, router]);

  // 조건부 렌더링
  if (!show) {
    return null;
  }

  return (
    <BackButtonContainer onClick={handleClick} className={className}>
      <IoArrowBack size={16} />
      <Text variant="body" fontWeight="medium">
        {text}
      </Text>
    </BackButtonContainer>
  );
}

const BackButtonContainer = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--grey-300);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--grey-700);

  &:hover {
    background: var(--grey-100);
    border-color: var(--grey-400);
    color: var(--grey-800);
  }

  &:active {
    transform: translateY(1px);
  }

  /* 모바일 최적화 */
  @media (max-width: 768px) {
    padding: 10px 14px;
    gap: 6px;
  }
`;