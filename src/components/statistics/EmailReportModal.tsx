"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { Button, Input } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import { toaster } from "@/components/ui/toaster";
import { CustomWordGroup, WordFrequency } from "./CustomWordGroupEditor";
import { WordFrequencyResponse } from "@/hooks/useWordFrequencyAnalysis";
import { generateEmailHTML } from "@/utils/email/report-generator";
import { sendEmail } from "@/utils/edge-functions/email";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyName: string;
  filters: {
    viewMode: string;
    selectedWeekIds: string[];
    timeRange: string;
  };
  wordFrequencyData: WordFrequencyResponse[];
  customGroups: CustomWordGroup[];
  apiGroups: CustomWordGroup[];
  weekNames: string[];
}

export default function EmailReportModal({
  isOpen,
  onClose,
  journeyName,
  filters,
  wordFrequencyData,
  customGroups,
  apiGroups,
  weekNames,
}: EmailReportModalProps) {
  const { user } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email) {
      toaster.create({
        title: "이메일 주소를 입력해주세요",
        type: "error",
      });
      return;
    }

    if (!user?.id) {
      toaster.create({
        title: "로그인이 필요합니다",
        type: "error",
      });
      return;
    }

    setIsSending(true);

    try {
      // Generate report data
      const reportData = {
        journeyName,
        filters,
        wordFrequencyData,
        customGroups,
        apiGroups,
        weekNames,
        generatedAt: new Date().toISOString(),
      };

      // Generate HTML email content
      const htmlContent = generateEmailHTML(reportData);

      // Send email
      console.log("Sending email to:", email);
      console.log("Journey name:", journeyName);
      console.log("HTML content:", htmlContent);
      const { error } = await sendEmail(
        email,
        `[${journeyName}] 학습 분석 보고서`,
        htmlContent,
        user.id
      );

      if (error) {
        throw error;
      }

      toaster.create({
        title: "보고서가 성공적으로 전송되었습니다",
        type: "success",
      });

      onClose();
      setEmail("");
    } catch (error) {
      console.error("Email send error:", error);
      toaster.create({
        title: "보고서 전송에 실패했습니다",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            📧 분석 보고서 이메일 전송
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <Label>
              <Text variant="body" fontWeight="medium">
                받는 사람 이메일
              </Text>
            </Label>
            <StyledInput
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
            <HelperText>
              <Text variant="caption" color="var(--grey-600)">
                입력한 이메일로 현재 페이지의 통계 분석 보고서가 전송됩니다.
                보고서에는 HTML 형식의 시각화 자료와 JSON 데이터가 포함됩니다.
              </Text>
            </HelperText>
          </FormGroup>

          <PreviewSection>
            <Text variant="body" fontWeight="medium">
              보고서 내용
            </Text>
            <PreviewList>
              <PreviewItem>✅ Journey 정보: {journeyName}</PreviewItem>
              <PreviewItem>✅ 분석 기간: {weekNames.join(", ")}</PreviewItem>
              <PreviewItem>✅ 요약 통계 (주차 수, 고유 단어, 총 빈도)</PreviewItem>
              <PreviewItem>✅ 자동 생성된 단어 그룹 ({apiGroups.length}개)</PreviewItem>
              <PreviewItem>✅ 커스텀 단어 그룹 ({customGroups.length}개)</PreviewItem>
              <PreviewItem>📊 주제별 빈도 변화 테이블 (시각적 막대 차트)</PreviewItem>
              <PreviewItem>✅ 주차별 요약 (상위 단어 포함)</PreviewItem>
            </PreviewList>
          </PreviewSection>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            취소
          </Button>
          <SendButton
            onClick={handleSend}
            disabled={!email || isSending}
            colorScheme="blue"
          >
            {isSending ? (
              "전송 중..."
            ) : (
              <>
                <FaPaperPlane />
                보고서 전송
              </>
            )}
          </SendButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--grey-200);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--grey-900);
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--grey-100);
  color: var(--grey-600);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--grey-200);
    color: var(--grey-700);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
`;

const StyledInput = styled(Input)`
  width: 100%;
`;

const HelperText = styled.div`
  margin-top: 0.25rem;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--grey-50);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const PreviewList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewItem = styled.li`
  font-size: 14px;
  color: var(--grey-700);
  padding-left: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--grey-200);
`;

const SendButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;