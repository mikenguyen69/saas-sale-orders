'use client'

import React, { useCallback, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  InsertDriveFile,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material'
import { useFileUpload, type UploadProgress } from '@/hooks/useFileUpload'

interface FileUploadProps {
  onUploadComplete?: (urls: string[]) => void
  onFilesChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxFileSize?: number // in bytes
  bucket?: string
  folder?: string
  disabled?: boolean
}

export function FileUpload({
  onUploadComplete,
  onFilesChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt',
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  bucket = 'attachments',
  folder,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const { uploads, uploadFile, removeUpload, clearUploads, isUploading } = useFileUpload()

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`
      }

      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim())
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        const mimeTypeAccepted = acceptedTypes.some(
          type => type === fileExtension || file.type.match(type.replace('*', '.*'))
        )

        if (!mimeTypeAccepted) {
          return `File type not supported. Accepted types: ${accept}`
        }
      }

      return null
    },
    [maxFileSize, accept]
  )

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (disabled || !files.length) return

      const fileArray = Array.from(files)

      // Validate file count
      if (uploads.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Validate each file
      const validFiles: File[] = []
      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          alert(`${file.name}: ${error}`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      // Notify parent about file changes
      onFilesChange?.(validFiles)

      // Upload files
      const uploadPromises = validFiles.map(file => uploadFile(file, bucket, folder))
      const urls = await Promise.all(uploadPromises)
      const successfulUrls = urls.filter((url): url is string => url !== null)

      if (successfulUrls.length > 0) {
        onUploadComplete?.(successfulUrls)
      }
    },
    [
      disabled,
      uploads.length,
      maxFiles,
      validateFile,
      onFilesChange,
      uploadFile,
      bucket,
      folder,
      onUploadComplete,
    ]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      handleFiles(files)
    },
    [disabled, handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const getStatusIcon = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle color="success" />
      case 'error':
        return <ErrorIcon color="error" />
      case 'uploading':
      case 'pending':
        return <CloudUpload color="action" />
      default:
        return <InsertDriveFile />
    }
  }

  const getStatusColor = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'completed':
        return 'success'
      case 'error':
        return 'error'
      case 'uploading':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          '&:hover': disabled
            ? {}
            : {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />

        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Drop files here' : 'Upload Files'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag and drop files here, or click to select files
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {accept && `Accepted formats: ${accept}`}
          {maxFileSize && <> • Max size: {Math.round(maxFileSize / (1024 * 1024))}MB</>}
          {multiple && <> • Max files: {maxFiles}</>}
        </Typography>
      </Paper>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="subtitle2">Files ({uploads.length})</Typography>
            <Button size="small" onClick={clearUploads} disabled={isUploading}>
              Clear All
            </Button>
          </Box>

          <List dense>
            {uploads.map((upload, index) => (
              <ListItem key={index} divider>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getStatusIcon(upload)}
                </Box>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap>
                        {upload.file.name}
                      </Typography>
                      <Chip
                        label={upload.status}
                        size="small"
                        color={getStatusColor(upload)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {upload.status === 'uploading' && (
                        <LinearProgress
                          variant="determinate"
                          value={upload.progress}
                          sx={{ mt: 0.5 }}
                        />
                      )}
                      {upload.status === 'error' && upload.error && (
                        <Typography variant="caption" color="error">
                          {upload.error}
                        </Typography>
                      )}
                      {upload.status === 'completed' && (
                        <Typography variant="caption" color="success.main">
                          Upload completed
                        </Typography>
                      )}
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => removeUpload(upload.file)}
                    disabled={upload.status === 'uploading'}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  )
}
