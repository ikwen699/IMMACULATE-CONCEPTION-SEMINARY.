'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface UploadResult {
  url: string
  filename: string
  size: number
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File, folder: string = 'receipts'): Promise<UploadResult | null> => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Upload failed')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}

interface FileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  folder?: string
  label?: string
}

export default function FileUpload({ onUpload, accept = 'image/*', folder = 'receipts', label = 'Upload File' }: FileUploadProps) {
  const { upload, uploading, error } = useUpload()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const result = await upload(file, folder)
    if (result) {
      onUpload(result.url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-4xl mb-2">+</div>
        <p className="text-sm text-gray-600">{uploading ? 'Uploading...' : label}</p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
      </label>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
