"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FaUpload, FaTimes, FaCheckCircle, FaExclamationTriangle, FaFile } from "react-icons/fa"
import { uploadFile } from "@/utils/file/upload"
import styled from "@emotion/styled"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import Image from "next/image"
import { sanitizeFileName } from "@/utils/file"

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileId?: number) => void
  onMultipleUploadComplete?: (results: UploadResult[]) => void
  acceptedFileTypes?: Record<string, string[]>
  maxFiles?: number
  maxSizeMB?: number
  multiple?: boolean
  placeholder?: string
  height?: string
  width?: string
  initialFileUrl?: string
  initialFileId?: number
}

interface UploadResult {
  success: boolean
  file?: File
  error?: any
  metadata?: any
  fileId?: number
  url?: string
}

interface FilePreview {
  file: File
  preview: string
  id: string
  uploading: boolean
  progress: number
  uploaded: boolean
  result?: UploadResult
}

const Container = styled.div<{ height?: string; width?: string }>`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || 'auto'};
`

const DropzoneContainer = styled.div<{ isDragActive: boolean; disabled: boolean; height?: string }>`
  border: 2px dashed ${props => props.isDragActive ? 'var(--primary-500)' : 'var(--grey-300)'};
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  background: ${props => props.isDragActive ? 'var(--primary-50)' : 'transparent'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  height: ${props => props.height || 'auto'};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: ${props => props.disabled ? 'var(--grey-300)' : 'var(--primary-500)'};
  }
`

const FilePreviewContainer = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
`

const FilePreviewItem = styled.div<{ uploaded: boolean }>`
  position: relative;
  border: 1px solid ${props => props.uploaded ? 'var(--positive-300)' : 'var(--grey-300)'};
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.uploaded ? 'var(--positive-50)' : 'white'};
  
  .file-content {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .file-info {
    padding: 0.5rem;
    font-size: 0.75rem;
    text-align: center;
    background: white;
  }
  
  .remove-button {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.75rem;
    
    &:hover {
      background: rgba(0, 0, 0, 0.9);
    }
  }
  
  .progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.25rem;
    font-size: 0.75rem;
    text-align: center;
  }
  
  .status-overlay {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    
    svg {
      background: white;
      border-radius: 50%;
      padding: 2px;
      width: 20px;
      height: 20px;
    }
  }
`

const SingleFileContainer = styled.div`
  margin-top: 1rem;
  border: 1px solid var(--grey-300);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  .file-content {
    aspect-ratio: 16/9;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .remove-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    
    &:hover {
      background: rgba(0, 0, 0, 0.9);
    }
  }
  
  .progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem;
    text-align: center;
  }
`

const ProgressBar = styled.div<{ value: number }>`
  width: 100%;
  height: 4px;
  background-color: var(--grey-200);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.value}%;
    background-color: var(--primary-500);
    transition: width 0.3s ease;
  }
`

export default function FileUpload({
  onUploadComplete,
  onMultipleUploadComplete,
  acceptedFileTypes = { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
  maxFiles = 1,
  maxSizeMB = 5,
  multiple = false,
  placeholder = "파일을 드래그하거나 클릭하여 업로드하세요",
  height,
  width,
  initialFileUrl,
  initialFileId,
}: FileUploadProps) {
  const { isAuthenticated, id } = useSupabaseAuth()
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileId?: number } | null>(
    initialFileUrl ? { url: initialFileUrl, fileId: initialFileId } : null
  )

  const isMultiple = multiple || maxFiles > 1
  const booledIsAuthenticated = Boolean(isAuthenticated)

  const uploadSingleFile = useCallback(async (file: File) => {
    if (!id) return

    const sanitizedFileName = sanitizeFileName(file.name)
    const renamedFile = new File([file], sanitizedFileName, {
      type: file.type,
    })

    const result = await uploadFile(renamedFile, id, {
      onProgress: (progress) => {
        setFilePreviews(prev => prev.map(fp => 
          fp.file.name === file.name ? { ...fp, progress } : fp
        ))
      }
    })

    return result
  }, [id])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!booledIsAuthenticated || !id) return

      if (isMultiple) {
        // Multiple file upload
        const newPreviews: FilePreview[] = acceptedFiles.map(file => ({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          id: `${file.name}-${Date.now()}`,
          uploading: true,
          progress: 0,
          uploaded: false,
        }))

        setFilePreviews(prev => [...prev, ...newPreviews])

        // Upload files one by one
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i]
          try {
            const result = await uploadSingleFile(file)
            
            setFilePreviews(prev => prev.map(fp => 
              fp.file.name === file.name 
                ? { 
                    ...fp, 
                    uploading: false, 
                    uploaded: true, 
                    progress: 100,
                    result: { success: true, ...result }
                  }
                : fp
            ))
          } catch (error) {
            setFilePreviews(prev => prev.map(fp => 
              fp.file.name === file.name 
                ? { 
                    ...fp, 
                    uploading: false, 
                    uploaded: false,
                    result: { success: false, error, file }
                  }
                : fp
            ))
          }
        }

        // Call completion callback
        const results = filePreviews
          .filter(fp => fp.result)
          .map(fp => fp.result!)
        
        if (onMultipleUploadComplete) {
          onMultipleUploadComplete(results)
        }
      } else {
        // Single file upload
        const file = acceptedFiles[0]
        const preview: FilePreview = {
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          id: `${file.name}-${Date.now()}`,
          uploading: true,
          progress: 0,
          uploaded: false,
        }

        setFilePreviews([preview])
        setUploadedFile(null)

        try {
          const result = await uploadSingleFile(file)
          
          if (result) {
            setFilePreviews(prev => prev.map(fp => ({
              ...fp,
              uploading: false,
              uploaded: true,
              progress: 100,
              result: { success: true, ...result }
            })))

            setUploadedFile({ url: result.url, fileId: result.fileId })

            if (onUploadComplete) {
              onUploadComplete(result.url, result.fileId)
            }
          } else {
            setFilePreviews(prev => prev.map(fp => ({
              ...fp,
              uploading: false,
              uploaded: false,
              result: { success: false, error: "Upload failed", file }
            })))
          }
        } catch (error) {
          setFilePreviews(prev => prev.map(fp => ({
            ...fp,
            uploading: false,
            uploaded: false,
            result: { success: false, error, file }
          })))
        }
      }
    },
    [booledIsAuthenticated, id, isMultiple, onUploadComplete, onMultipleUploadComplete, uploadSingleFile],
  )

  const removeFilePreview = (fileId: string) => {
    setFilePreviews(prev => {
      const updated = prev.filter(fp => fp.id !== fileId)
      // Clean up object URLs
      const toRemove = prev.find(fp => fp.id === fileId)
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview)
      }
      return updated
    })
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setFilePreviews([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: isMultiple,
    maxFiles,
    disabled: !booledIsAuthenticated,
  })

  const shouldShowDropzone = isMultiple || (!uploadedFile && filePreviews.length === 0)

  return (
    <Container width={width} height={height}>
      {shouldShowDropzone && (
        <DropzoneContainer
          {...getRootProps()}
          isDragActive={isDragActive}
          disabled={!booledIsAuthenticated}
          height={height}
        >
          <input {...getInputProps()} />
          <FaUpload style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem', 
            color: 'var(--grey-400)'
          }} />
          {isDragActive ? (
            <p>여기에 파일을 놓으세요...</p>
          ) : (
            <div>
              <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                {booledIsAuthenticated ? placeholder : "로그인 후 이용 가능합니다"}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--grey-500)' }}>
                최대 {maxFiles}개 파일 • 파일당 최대 {maxSizeMB}MB
              </p>
            </div>
          )}
        </DropzoneContainer>
      )}

      {/* Single file uploaded result */}
      {!isMultiple && uploadedFile && (
        <SingleFileContainer>
          <div className="file-content">
            {uploadedFile.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <Image
                src={uploadedFile.url}
                alt="업로드된 파일"
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <FaFile style={{ fontSize: '4rem', color: 'var(--grey-400)' }} />
            )}
            <button className="remove-button" onClick={removeUploadedFile}>
              <FaTimes />
            </button>
          </div>
        </SingleFileContainer>
      )}

      {/* Multiple files or single file being processed */}
      {(isMultiple || (!uploadedFile && filePreviews.length > 0)) && filePreviews.length > 0 && (
        <FilePreviewContainer>
          {filePreviews.map((filePreview) => (
            <FilePreviewItem key={filePreview.id} uploaded={filePreview.uploaded}>
              <div className="file-content">
                {filePreview.preview ? (
                  <Image
                    src={filePreview.preview}
                    alt={filePreview.file.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <FaFile style={{ fontSize: '2rem', color: 'var(--grey-400)' }} />
                )}
                
                <button 
                  className="remove-button" 
                  onClick={() => removeFilePreview(filePreview.id)}
                >
                  <FaTimes />
                </button>

                {filePreview.uploaded && (
                  <div className="status-overlay">
                    <FaCheckCircle style={{ color: 'var(--positive-500)' }} />
                  </div>
                )}

                {filePreview.uploading && (
                  <div className="progress-overlay">
                    업로드 중... {Math.round(filePreview.progress)}%
                    <ProgressBar value={filePreview.progress} />
                  </div>
                )}

                {filePreview.result && !filePreview.result.success && (
                  <div className="status-overlay">
                    <FaExclamationTriangle style={{ color: 'var(--negative-500)' }} />
                  </div>
                )}
              </div>
              
              <div className="file-info">
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                  {filePreview.file.name.length > 15 
                    ? filePreview.file.name.substring(0, 12) + '...' 
                    : filePreview.file.name}
                </div>
                <div style={{ color: 'var(--grey-500)' }}>
                  {(filePreview.file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            </FilePreviewItem>
          ))}
        </FilePreviewContainer>
      )}
    </Container>
  )
}