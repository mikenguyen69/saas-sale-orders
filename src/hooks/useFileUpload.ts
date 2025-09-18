'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAppStateContext } from '@/components/providers/AppStateProvider'
import type { Database } from '@/types/supabase'

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const { user } = useAuthContext()
  const { showError, showSuccess } = useAppStateContext()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadFile = useCallback(
    async (file: File, bucket: string = 'attachments', folder?: string): Promise<string | null> => {
      if (!user) {
        showError('You must be logged in to upload files')
        return null
      }

      // Add to uploads state
      const newUpload: UploadProgress = {
        file,
        progress: 0,
        status: 'pending',
      }

      setUploads(prev => [...prev, newUpload])

      try {
        // Create unique file name
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = folder ? `${folder}/${fileName}` : fileName

        // Update status to uploading
        setUploads(prev =>
          prev.map(upload =>
            upload.file === file ? { ...upload, status: 'uploading' as const } : upload
          )
        )

        // Upload file
        const { data, error } = await supabase.storage.from(bucket).upload(filePath, file)

        if (error) {
          throw error
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path)

        // Update status to completed
        setUploads(prev =>
          prev.map(upload =>
            upload.file === file
              ? { ...upload, status: 'completed' as const, url: publicUrl, progress: 100 }
              : upload
          )
        )

        showSuccess(`File "${file.name}" uploaded successfully`)
        return publicUrl
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'

        // Update status to error
        setUploads(prev =>
          prev.map(upload =>
            upload.file === file
              ? { ...upload, status: 'error' as const, error: errorMessage }
              : upload
          )
        )

        showError(`Failed to upload "${file.name}": ${errorMessage}`)
        return null
      }
    },
    [user, supabase, showError, showSuccess]
  )

  const uploadMultipleFiles = useCallback(
    async (files: File[], bucket?: string, folder?: string): Promise<string[]> => {
      const results = await Promise.allSettled(files.map(file => uploadFile(file, bucket, folder)))

      return results
        .map(result => {
          if (result.status === 'fulfilled' && result.value) {
            return result.value
          }
          return null
        })
        .filter((url): url is string => url !== null)
    },
    [uploadFile]
  )

  const removeUpload = useCallback((file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file))
  }, [])

  const clearUploads = useCallback(() => {
    setUploads([])
  }, [])

  const deleteFile = useCallback(
    async (filePath: string, bucket: string = 'attachments'): Promise<boolean> => {
      try {
        const { error } = await supabase.storage.from(bucket).remove([filePath])

        if (error) {
          throw error
        }

        showSuccess('File deleted successfully')
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Delete failed'
        showError(`Failed to delete file: ${errorMessage}`)
        return false
      }
    },
    [supabase, showError, showSuccess]
  )

  return {
    uploads,
    uploadFile,
    uploadMultipleFiles,
    removeUpload,
    clearUploads,
    deleteFile,
    isUploading: uploads.some(upload => upload.status === 'uploading'),
  }
}
