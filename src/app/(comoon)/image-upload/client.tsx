"use client";

import { Box, FileUpload, Icon, Button } from "@chakra-ui/react";
import { LuUpload, LuTrash, LuCopy, LuCheck } from "react-icons/lu";
import imageCompression from "browser-image-compression";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { sanitizeFileName } from "@/utils/file";
import { toaster } from "@/components/ui/toaster";
import Image from "next/image";
import styled from "@emotion/styled";
import { uploadFile, getImageUrl } from "@/utils/data/storage";

export default function ImageUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<
    { url: string; fileName: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { id: userId, isAuthenticated } = useSupabaseAuth();
  const prevAcceptedFilesRef = useRef<File[]>([]);
  const acceptedFilesRef = useRef<File[]>([]);

  // 이미지 압축
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("이미지 압축 중 오류 발생:", error);
      return file;
    }
  };

  // 단일 파일 업로드 함수
  const uploadSingleFile = async (
    file: File
  ): Promise<{ url: string; fileName: string } | null> => {
    try {
      // 원본 파일명 저장
      const originalFileName = file.name;

      // 파일명 정리
      const sanitizedFileName = sanitizeFileName(file.name);
      const renamedFile = new File([file], sanitizedFileName, {
        type: file.type,
      });

      // 압축 처리
      const compressedFile = await compressImage(renamedFile);

      // uploadFile 함수 사용
      const { data, error } = await uploadFile(compressedFile);

      if (error) {
        console.error("Supabase 업로드 오류:", error.message);
        
        // 특정 에러 메시지에 따른 처리
        if (error.message.includes("row-level security policy") || 
            error.message.includes("403") || 
            error.message.includes("Unauthorized")) {
          // 보안 정책 오류는 사용자에게 표시
          toaster.create({
            title: "권한이 없습니다. 권한을 확인해주세요.",
            duration: 3000,
            type: "error",
          });
        } else if (error.message.includes("인증된 사용자만")) {
          // 인증 오류
          toaster.create({
            title: "로그인이 필요합니다",
            duration: 3000,
            type: "error",
          });
        }
        
        return null; // 오류 발생 시 null 반환하고 에러를 던지지 않음
      }

      if (!data?.path) {
        return null;
      }

      // getImageUrl 함수를 사용하여 URL 가져오기
      const url = await getImageUrl(data.path);

      return {
        url: url,
        fileName: originalFileName,
      };
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      
      // 일반적인 예외 처리
      toaster.create({
        title: "파일 업로드 중 오류가 발생했습니다",
        duration: 3000,
        type: "error",
      });
      
      return null;
    }
  };

  // 파일 목록 변경 감지 - 렌더링 외부에서 업데이트
  useEffect(() => {
    if (acceptedFilesRef.current.length > 0 &&
        JSON.stringify(prevAcceptedFilesRef.current) !== 
        JSON.stringify(acceptedFilesRef.current)) {
      setFiles(acceptedFilesRef.current);
      prevAcceptedFilesRef.current = [...acceptedFilesRef.current];
    }
  }, [acceptedFilesRef.current]);

  // 모든 파일 업로드 처리
  const handleUploadAll = async () => {
    if (!isAuthenticated || !userId) {
      toaster.create({
        title: "로그인이 필요합니다",
        duration: 3000,
        type: "error",
      });
      return;
    }

    if (files.length === 0) {
      toaster.create({
        title: "업로드할 파일을 선택해주세요",
        duration: 3000,
        type: "warning",
      });
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let failCount = 0;
      const uploadResults: { url: string; fileName: string }[] = [];

      // Promise.all 대신 순차적으로 처리하여 개별 오류 처리
      for (const file of files) {
        try {
          const result = await uploadSingleFile(file);
          if (result) {
            uploadResults.push(result);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error("파일 업로드 오류:", error);
          failCount++;
        }
      }

      // 유효한 결과만 상태에 추가
      if (uploadResults.length > 0) {
        setUploadedUrls((prev) => [...prev, ...uploadResults]);

        toaster.create({
          title: `${successCount}개 파일 업로드 완료${
            failCount > 0 ? `, ${failCount}개 실패` : ""
          }`,
          duration: 3000,
          type: successCount > 0 ? "success" : "error",
        });
      } else if (failCount > 0) {
        toaster.create({
          title: `모든 파일(${failCount}개) 업로드 실패`,
          type: "error",
          duration: 3000,
        });
      }

      // 업로드 후 파일 목록 초기화
      setFiles([]);
      prevAcceptedFilesRef.current = [];
      acceptedFilesRef.current = [];
    } catch (error) {
      toaster.create({
        title: "업로드 중 오류가 발생했습니다",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // URL 복사 함수
  const handleCopyUrl = useCallback((url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);

    // 3초 후 복사 상태 초기화
    setTimeout(() => {
      setCopiedIndex(null);
    }, 3000);

    toaster.create({
      title: "이미지 URL이 클립보드에 복사되었습니다",
      duration: 3000,
      type: "success",
    });
  }, []);

  // 업로드된 파일 삭제
  const handleDelete = useCallback(async (fileUrl: string, index: number) => {
    try {
      const supabase = createClient();

      // URL에서 파일 경로 추출
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(
        /\/object\/public\/images\/(.*?)(\?.*)?$/
      );

      if (!pathMatch || !pathMatch[1]) {
        throw new Error("파일 경로를 추출할 수 없습니다");
      }

      const filePath = pathMatch[1];

      // 파일 삭제
      const { error } = await supabase.storage
        .from("images")
        .remove([filePath]);

      if (error) {
        throw new Error(`삭제 실패: ${error.message}`);
      }

      // 삭제된 URL 제거
      setUploadedUrls((prev) => prev.filter((_, i) => i !== index));

      toaster.create({
        title: "파일이 삭제되었습니다",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: "파일 삭제 중 오류가 발생했습니다",
        type: "error",
        duration: 3000,
      });
    }
  }, []);

  // 파일 콜렉션 업데이트 핸들러
  const updateAcceptedFiles = useCallback((files: File[]) => {
    acceptedFilesRef.current = files;
  }, []);

  return (
      <Container>
        <FileUpload.Root
          maxW="xl"
          alignItems="stretch"
          maxFiles={20}
          accept={{
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
          }}
          disabled={isUploading || !isAuthenticated}
        >
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone>
            <Icon size="md" color="fg.muted">
              <LuUpload />
            </Icon>
            <FileUpload.DropzoneContent>
              <Box>이미지를 드래그하거나 클릭하여 업로드하세요</Box>
              <Box color="fg.muted">.png, .jpg 최대 5MB</Box>
              {!isAuthenticated && (
                <Box color="red.500">로그인 후 이용 가능합니다</Box>
              )}
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>
          <FileUpload.ItemGroup>
            <FileUpload.Context>
              {({ acceptedFiles }) => {
                // 렌더링 중 직접 상태 업데이트 대신 ref 업데이트 후 useEffect에서 처리
                updateAcceptedFiles(acceptedFiles);
                
                return acceptedFiles.map((file) => (
                  <FileUpload.Item key={file.name} file={file}>
                    <FileUpload.ItemPreview />
                    <FileUpload.ItemName />
                    <FileUpload.ItemSizeText />
                    <FileUpload.ItemDeleteTrigger />
                  </FileUpload.Item>
                ));
              }}
            </FileUpload.Context>
          </FileUpload.ItemGroup>
          <Button
            width="100%"
            onClick={handleUploadAll}
            loading={isUploading}
            disabled={files.length === 0 || !isAuthenticated}
            mt={4}
          >
            업로드
          </Button>
        </FileUpload.Root>

        {uploadedUrls.length > 0 && (
          <UploadedFilesContainer>
            <Box as="h3" fontSize="lg" mb={2}>
              업로드된 파일
            </Box>
            <UploadedFilesList>
              {uploadedUrls.map(({ url, fileName }, index) => (
                <UploadedFileItem key={index}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={url}
                      alt={fileName}
                      fill
                      sizes="(max-width: 768px) 100vw, 200px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <OverlayButtons>
                    <CopyButton
                      onClick={() => handleCopyUrl(url, index)}
                      title="URL 복사"
                    >
                      {copiedIndex === index ? <LuCheck /> : <LuCopy />}
                    </CopyButton>
                    <DeleteButton
                      onClick={() => handleDelete(url, index)}
                      title="삭제"
                    >
                      <LuTrash />
                    </DeleteButton>
                  </OverlayButtons>
                  <FileNameOverlay>
                    <FileName>{fileName}</FileName>
                  </FileNameOverlay>
                </UploadedFileItem>
              ))}
            </UploadedFilesList>
          </UploadedFilesContainer>
        )}
      </Container>
  );
}

const Container = styled.div`
  margin: 0 auto;
  max-width: var(--breakpoint-tablet);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  min-height: 100vh;
`;

const UploadedFilesContainer = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const UploadedFilesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  width: 100%;
`;

const UploadedFileItem = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1/1;
  height: 200px;
`;

const OverlayButtons = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;

  ${UploadedFileItem}:hover & {
    opacity: 1;
  }
`;

const ButtonBase = styled.button`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const CopyButton = styled(ButtonBase)`
  background: rgba(0, 0, 0, 0.5);
`;

const DeleteButton = styled(ButtonBase)`
  background: rgba(255, 0, 0, 0.5);

  &:hover {
    background: rgba(255, 0, 0, 0.7);
  }
`;

const FileNameOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;

  ${UploadedFileItem}:hover & {
    opacity: 1;
  }
`;

const FileName = styled.p`
  color: white;
  margin: 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;