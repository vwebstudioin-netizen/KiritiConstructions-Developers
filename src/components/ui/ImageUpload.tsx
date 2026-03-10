'use client'
import { useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi'

interface ImageUploadProps {
  folder: string          // e.g. "projects/project-id"
  value: string[]         // current image URLs
  onChange: (urls: string[]) => void
  maxImages?: number
  label?: string
}

export default function ImageUpload({ folder, value, onChange, maxImages = 10, label = 'Images' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList) => {
    if (!files.length) return
    const remaining = maxImages - value.length
    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    const uploaded: string[] = []
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      setProgress(`Uploading ${i + 1} of ${toUpload.length}...`)
      try {
        const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storageRef = ref(storage, path)
        const snap = await uploadBytes(storageRef, file)
        const url = await getDownloadURL(snap.ref)
        uploaded.push(url)
      } catch {
        // Firebase not configured — use local blob as preview
        uploaded.push(URL.createObjectURL(file))
      }
    }

    onChange([...value, ...uploaded])
    setUploading(false)
    setProgress('')
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const setAsCover = (url: string) => {
    // Move selected image to front (index 0 = cover)
    const rest = value.filter((u) => u !== url)
    onChange([url, ...rest])
  }

  return (
    <div>
      <label className="block font-body text-xs text-muted uppercase tracking-wider mb-2">
        {label} {value.length > 0 && `(${value.length}${maxImages < 99 ? `/${maxImages}` : ''})`}
        {value.length > 0 && <span className="ml-2 text-muted/60 normal-case">— first image is the cover</span>}
      </label>

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {value.map((url, i) => (
            <div key={i} className={`relative group aspect-video rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-accent' : 'border-gray-200'}`}>
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-accent text-dark text-xs font-bold px-2 py-0.5 rounded-lg">Cover</span>
              )}
              {/* Actions on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsCover(url)}
                    className="bg-accent text-dark text-xs font-semibold px-2 py-1 rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    Set Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <FiX size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {value.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-50 transition-all rounded-xl p-6 flex flex-col items-center gap-2 disabled:opacity-60"
        >
          <FiUploadCloud className={`text-muted ${uploading ? 'animate-pulse' : ''}`} size={28} />
          <p className="font-body text-sm font-medium text-dark">
            {uploading ? progress : 'Click to upload images'}
          </p>
          <p className="font-body text-xs text-muted">
            {uploading ? 'Please wait...' : `JPG, PNG, WEBP — up to ${maxImages - value.length} more`}
          </p>
        </button>
      )}

      {value.length === 0 && !uploading && (
        <div className="mt-2 flex items-center gap-2 text-muted font-body text-xs">
          <FiImage size={13} />
          No images yet — first image uploaded will be the cover photo.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
    </div>
  )
}
