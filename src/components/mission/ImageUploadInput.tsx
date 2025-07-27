"use client";

import { useState, useRef } from "react";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";
import { MissionQuestion } from "@/types";
import { FaUpload, FaTrash } from "react-icons/fa";
import { uploadMultipleFiles } from "@/utils/file/upload";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toaster } from "@/components/ui/toaster";

interface ImageUploadInputProps {
  question: MissionQuestion;
  questionIndex: number;
  initialValue?: string[];
  onChange: (questionId: string, imageUrls: string[]) => void;
  onValidation?: (questionId: string, isValid: boolean) => void;
}

export default function ImageUploadInput({
  question,
  questionIndex,
  initialValue = [],
  onChange,
  onValidation,
}: ImageUploadInputProps) {
  const { id: userId } = useSupabaseAuth();
  const [imageUrls, setImageUrls] = useState<string[]>(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = question.max_images || 5;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !userId) return;

    const remainingSlots = maxImages - imageUrls.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});
    
    try {
      const uploadResults = await uploadMultipleFiles(
        filesToUpload, 
        userId,
        (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }));
        }
      );

      const successfulUploads = uploadResults.filter(result => result.success);
      const newImageUrls = successfulUploads.map(result => result.url!);

      if (successfulUploads.length < filesToUpload.length) {
        const failedCount = filesToUpload.length - successfulUploads.length;
        toaster.create({
          title: `${failedCount}개 파일 업로드 실패`,
          description: "일부 파일 업로드에 실패했습니다.",
          type: "warning",
        });
      }

      const updatedUrls = [...imageUrls, ...newImageUrls];
      setImageUrls(updatedUrls);
      onChange(question.id, updatedUrls);
      
      // Validation
      const isValid = question.is_required ? updatedUrls.length > 0 : true;
      onValidation?.(question.id, isValid);

      if (successfulUploads.length > 0) {
        toaster.create({
          title: `${successfulUploads.length}개 이미지 업로드 완료`,
          type: "success",
        });
      }
      
    } catch (error) {
      console.error("Image upload failed:", error);
      toaster.create({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    onChange(question.id, updatedUrls);
    
    // Validation
    const isValid = question.is_required ? updatedUrls.length > 0 : true;
    onValidation?.(question.id, isValid);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <QuestionContainer>
      <QuestionHeader>
        <QuestionNumber>질문 {questionIndex + 1}</QuestionNumber>
        <QuestionText>
          <Text variant="body" fontWeight="bold">
            {question.question_text}
          </Text>
        </QuestionText>
        <QuestionSubtext>
          <Text variant="caption" color="var(--grey-600)">
            최대 {maxImages}개의 이미지를 업로드할 수 있습니다.
          </Text>
        </QuestionSubtext>
        {question.is_required && (
          <RequiredMark>
            <Text variant="caption" color="var(--negative-500)">*필수</Text>
          </RequiredMark>
        )}
      </QuestionHeader>

      <UploadSection>
        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
        />
        
        {imageUrls.length < maxImages && (
          <UploadButton onClick={triggerFileInput} disabled={isUploading || !userId}>
            <FaUpload />
            <Text variant="body">
              {!userId ? "로그인 필요" : isUploading ? "업로드 중..." : "이미지 선택"}
            </Text>
            {isUploading && Object.keys(uploadProgress).length > 0 && (
              <ProgressInfo>
                {Object.values(uploadProgress).some(p => p > 0) && (
                  <Text variant="caption" color="var(--primary-600)">
                    {Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.keys(uploadProgress).length)}%
                  </Text>
                )}
              </ProgressInfo>
            )}
          </UploadButton>
        )}

        {imageUrls.length > 0 && (
          <ImageGrid>
            {imageUrls.map((url, index) => (
              <ImagePreview key={index}>
                <Image src={url} alt={`업로드된 이미지 ${index + 1}`} />
                <RemoveButton onClick={() => handleRemoveImage(index)}>
                  <FaTrash />
                </RemoveButton>
              </ImagePreview>
            ))}
          </ImageGrid>
        )}

        <UploadStatus>
          <Text variant="caption" color="var(--grey-600)">
            {imageUrls.length} / {maxImages} 이미지 업로드됨
          </Text>
        </UploadStatus>
      </UploadSection>

      {question.points && (
        <PointsDisplay>
          <Text variant="caption" color="var(--primary-600)">
            {question.points}점
          </Text>
        </PointsDisplay>
      )}
    </QuestionContainer>
  );
}

const QuestionContainer = styled.div`
  border: 1px solid var(--grey-200);
  border-radius: 8px;
  padding: 16px;
  background: var(--white);
  margin-bottom: 16px;
`;

const QuestionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const QuestionNumber = styled.div`
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  width: fit-content;
`;

const QuestionText = styled.div`
  margin: 4px 0;
`;

const QuestionSubtext = styled.div``;

const RequiredMark = styled.div`
  width: fit-content;
`;

const UploadSection = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: var(--grey-50);
  border-radius: 6px;
  border: 2px dashed var(--grey-300);
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--white);
  border: 1px solid var(--grey-300);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  
  &:hover {
    background: var(--grey-100);
    border-color: var(--primary-300);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const ImagePreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--grey-200);
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--negative-500);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  
  &:hover {
    background: var(--negative-600);
  }
`;

const UploadStatus = styled.div`
  margin-top: 8px;
  text-align: center;
`;

const PointsDisplay = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px;
  background: var(--primary-50);
  border-radius: 4px;
  width: fit-content;
  margin-left: auto;
`;

const ProgressInfo = styled.div`
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;