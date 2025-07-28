import { useState, useCallback, useEffect } from "react";
import { uploadFile } from "@/utils/file/upload";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import styles from "./FileUpload.module.css";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Image from "next/image";
import { FaUpload } from "react-icons/fa";
import Spinner from "./Spinner";
import Text from "../Text/Text";
import { sanitizeFileName } from "@/utils/file";


interface FileWithPreview extends File {
  preview: string;
  id: string;
}

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileId?: number) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  initialFileUrl?: string;
  initialFileId?: number;
  height?: string;
  width?: string;
}

export default function FileUpload({
  onUploadComplete,
  icon = <FaUpload />,
  placeholder = "이미지를 드래그하거나 클릭하여 업로드하세요",
  initialFileUrl,
  initialFileId,
  height = "200px",
  width = "100%",
}: FileUploadProps) {
  const { isAuthenticated, id } = useSupabaseAuth();
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(
    initialFileUrl || null
  );
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(
    initialFileId || null
  );

  const booledIsAuthenticated = Boolean(isAuthenticated);

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

  // 파일 드롭 처리
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newFile = acceptedFiles[0];

      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }

      setUploading(true);

      try {
        const compressedFile = await compressImage(newFile);
        const fileWithPreview = Object.assign(compressedFile, {
          preview: URL.createObjectURL(compressedFile),
          id: `${newFile.name}-${Date.now()}`,
        });

        setFile(fileWithPreview);
        // 새 파일을 선택하면 기존 업로드된 파일 URL 초기화
        setUploadedFileUrl(null);
      } catch (error) {
        console.error("파일 처리 중 오류 발생:", error);
        setUploadError("파일 처리 중 오류가 발생했습니다.");
      } finally {
        setUploading(false);
      }
    },
    [file]
  );

  // 선택한 파일 제거
  const removeFile = () => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
  };

  // 업로드된 이미지 삭제
  const deleteUploadedFile = async () => {
    if (initialFileUrl) {
      setUploadedFileUrl(null);
      setUploadedFileId(null);
      return;
    }
    if (!uploadedFileUrl || !uploadedFileId) return;

    setUploading(true);

    try {
      const supabase = createClient();
      
      // Mark file as inactive in database (soft delete)
      const { error: dbError } = await supabase
        .from("files")
        .update({ is_active: false })
        .eq("id", uploadedFileId);

      if (dbError) {
        throw new Error(`파일 삭제 실패: ${dbError.message}`);
      }

      setUploadedFileUrl(null);
      setUploadedFileId(null);
    } catch (error) {
      console.error("파일 삭제 오류:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "파일 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
    }
  };

  // 파일 업로드 처리
  const handleUpload = async () => {
    if (!file || !id) return;

    setUploading(true);
    setUploadError(null);

    try {
      const sanitizedFileName = sanitizeFileName(file.name);
      const renamedFile = new File([file], sanitizedFileName, {
        type: file.type,
      });

      Object.assign(renamedFile, {
        preview: file.preview,
        id: file.id,
      });

      // Use new upload system
      const result = await uploadFile(renamedFile, id);

      if (onUploadComplete) {
        onUploadComplete(result.url, result.fileId);
      }

      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }

      // 업로드 성공 후 상태 업데이트
      setFile(null);
      setUploadedFileUrl(result.url);
      setUploadedFileId(result.fileId);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "업로드 중 오류가 발생했습니다."
      );
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  return (
    <div
      className={styles.fileUploadContainer}
      style={{ height: height, width: width }}
    >
      {booledIsAuthenticated === false && (
        <Text variant="caption" color="var(--grey-500)">
          {placeholder}
        </Text>
      )}

      {!file && !uploadedFileUrl ? (
        <div
          style={{ height: height, width: width }}
          className={`${styles.dropzone} 
          ${isDragActive ? styles.active : ""} ${
            booledIsAuthenticated === false ? styles.disabled : ""
          }`}
          {...getRootProps()}
        >
          <input
            {...getInputProps()}
            disabled={booledIsAuthenticated === false}
          />
          {isDragActive ? (
            <p>이미지를 여기에 놓으세요...</p>
          ) : (
            <>
              <div className={styles.uploadIcon}>{icon}</div>
              <Text variant="caption" color="var(--grey-500)">
                {booledIsAuthenticated === false
                  ? "로그인 후 이용 가능합니다"
                  : placeholder}
              </Text>
            </>
          )}
        </div>
      ) : file ? (
        <div className={styles.imagePreviewContainer}>
          <Image
            className={styles.imagePreview}
            src={file.preview}
            alt={file.name}
            width={100}
            height={100}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
          <button className={styles.removeButton} onClick={removeFile}>
            ✕
          </button>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={uploading || booledIsAuthenticated === false}
          >
            {uploading ? <Spinner size="12px" /> : "업로드"}
          </button>
        </div>
      ) : (
        uploadedFileUrl && (
          <div className={styles.imagePreviewContainer}>
            <Image
              className={styles.imagePreview}
              src={uploadedFileUrl}
              alt="업로드된 이미지"
              width={100}
              height={100}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            <button
              className={styles.removeButton}
              onClick={deleteUploadedFile}
              disabled={uploading}
            >
              {uploading ? <Spinner size="8px" /> : "✕"}
            </button>
          </div>
        )
      )}

      {uploadError && <Text color="var(--negative-500)">{uploadError}</Text>}
    </div>
  );
}
