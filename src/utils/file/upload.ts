import { createClient } from "@/utils/supabase/client"
import imageCompression from "browser-image-compression"

interface UploadOptions {
  onProgress?: (progress: number) => void
  generateThumbnail?: boolean
}

// Files 데이터베이스 레코드 타입 정의 (새로운 중앙 파일 시스템)
interface FileRecord {
  id: number
  original_name: string
  url: string
  file_type: "image" | "file"
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  uploaded_at: string | null
  is_active: boolean | null
}

interface UploadResult {
  url: string
  fileId: number
  metadata: FileRecord
}

// 업로드 결과 타입 정의
interface UploadResultWithStatus {
  success: boolean
  url?: string
  fileId?: number
  metadata?: FileRecord
  error?: Error | unknown
  file?: File
}

export async function uploadFile(file: File, userId: string, options?: UploadOptions): Promise<UploadResult> {
  const supabase = createClient()

  // Determine file type
  const isImage = file.type.startsWith('image/')
  const fileType: "image" | "file" = isImage ? "image" : "file"
  
  let processedFile = file

  // Compress images only
  if (isImage) {
    processedFile = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: options?.onProgress,
    })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const ext = file.name.split(".").pop()
  const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`
  
  // IMPORTANT: Maintain existing path structure for RLS policy compatibility
  // Current system uses: public/${userId}/${filename}
  const path = `public/${userId}/${filename}`

  // Upload to Supabase Storage (use "images" bucket as current system)
  const { error } = await supabase.storage.from("images").upload(path, processedFile, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(path)

  // Save to database using new files table
  const { data: fileRecord, error: dbError } = await supabase
    .from("files")
    .insert({
      original_name: file.name,
      url: publicUrl,
      file_type: fileType,
      file_size: processedFile.size,
      mime_type: file.type,
      uploaded_by: userId,
    })
    .select()
    .single()

  if (dbError) throw dbError

  return {
    url: publicUrl,
    fileId: (fileRecord as any).id,
    metadata: fileRecord,
  }
}

export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<UploadResultWithStatus[]> {
  const results: UploadResultWithStatus[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(files[i], userId, {
        onProgress: (progress) => onProgress?.(i, progress),
      })
      results.push({ success: true, ...result })
    } catch (error) {
      results.push({ success: false, error, file: files[i] })
    }
  }

  return results
}

// Helper function for backward compatibility - uploads single image
export async function uploadPhoto(file: File, userId: string, options?: UploadOptions): Promise<UploadResult> {
  return uploadFile(file, userId, options)
}

// Helper function for backward compatibility - uploads multiple images
export async function uploadMultiplePhotos(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<UploadResultWithStatus[]> {
  return uploadMultipleFiles(files, userId, onProgress)
}
