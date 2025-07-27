import { createClient } from "@/utils/supabase/client"

export interface FileInfo {
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

/**
 * Get file URL from file ID
 */
export async function getFileUrl(fileId: number): Promise<string | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("files")
    .select("url")
    .eq("id", fileId)
    .eq("is_active", true)
    .single()
  
  if (error || !data) {
    console.error("Error fetching file URL:", error)
    return null
  }
  
  return data.url
}

/**
 * Get complete file information from file ID
 */
export async function getFileInfo(fileId: number): Promise<FileInfo | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("is_active", true)
    .single()
  
  if (error || !data) {
    console.error("Error fetching file info:", error)
    return null
  }
  
  return data
}

/**
 * Get multiple file URLs from file IDs
 */
export async function getFileUrls(fileIds: number[]): Promise<Record<number, string>> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("files")
    .select("id, url")
    .in("id", fileIds)
    .eq("is_active", true)
  
  if (error || !data) {
    console.error("Error fetching file URLs:", error)
    return {}
  }
  
  return data.reduce((acc, file) => {
    acc[file.id] = file.url
    return acc
  }, {} as Record<number, string>)
}

/**
 * Soft delete a file (mark as inactive)
 */
export async function deleteFile(fileId: number): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from("files")
    .update({ is_active: false })
    .eq("id", fileId)
  
  if (error) {
    console.error("Error deleting file:", error)
    return false
  }
  
  return true
}

/**
 * Get user's file usage statistics
 */
export async function getUserFileStats(userId: string): Promise<{
  totalFiles: number
  totalSizeBytes: number
  imageCount: number
  fileCount: number
} | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from("files")
    .select("file_type, file_size")
    .eq("uploaded_by", userId)
    .eq("is_active", true)
  
  if (error || !data) {
    console.error("Error fetching file stats:", error)
    return null
  }
  
  const stats = data.reduce(
    (acc, file) => {
      acc.totalFiles++
      acc.totalSizeBytes += file.file_size || 0
      
      if (file.file_type === "image") {
        acc.imageCount++
      } else {
        acc.fileCount++
      }
      
      return acc
    },
    { totalFiles: 0, totalSizeBytes: 0, imageCount: 0, fileCount: 0 }
  )
  
  return stats
}

/**
 * Helper to get profile image URL from profile_image_file_id or fallback to profile_image
 */
export async function getProfileImageUrl(
  profileImageFileId: number | null,
  fallbackUrl: string | null
): Promise<string | null> {
  if (profileImageFileId) {
    const url = await getFileUrl(profileImageFileId)
    if (url) return url
  }
  
  return fallbackUrl
}

/**
 * Helper to get journey image URL from image_file_id or fallback to image_url
 */
export async function getJourneyImageUrl(
  imageFileId: number | null,
  fallbackUrl: string | null
): Promise<string | null> {
  if (imageFileId) {
    const url = await getFileUrl(imageFileId)
    if (url) return url
  }
  
  return fallbackUrl
}

/**
 * Helper to get attachment URL from attachment_file_id or fallback to file_url
 */
export async function getAttachmentUrl(
  attachmentFileId: number | null,
  fallbackUrl: string | null
): Promise<string | null> {
  if (attachmentFileId) {
    const url = await getFileUrl(attachmentFileId)
    if (url) return url
  }
  
  return fallbackUrl
}