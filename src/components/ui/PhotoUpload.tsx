'use client'
import { useState, useRef } from 'react'
import { FiCamera, FiX, FiUpload } from 'react-icons/fi'
import { uploadTransactionPhoto } from '@/lib/upload'

interface PhotoUploadProps {
  projectId: string
  materialName: string
  onUploaded: (urls: string[]) => void
  maxPhotos?: number
}

export default function PhotoUpload({ projectId, materialName, onUploaded, maxPhotos = 3 }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const remaining = maxPhotos - uploadedUrls.length
    const selected = Array.from(files).slice(0, remaining)
    if (selected.length === 0) return

    setUploading(true)

    // Show local previews immediately
    const newPreviews = selected.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])

    // Upload to Firebase Storage
    const urls: string[] = []
    for (const file of selected) {
      const url = await uploadTransactionPhoto(file, projectId, materialName)
      if (url) {
        urls.push(url)
      } else {
        // If upload fails (Firebase not configured), use the local preview as placeholder
        urls.push(newPreviews[selected.indexOf(file)])
      }
    }

    const allUrls = [...uploadedUrls, ...urls]
    setUploadedUrls(allUrls)
    onUploaded(allUrls)
    setUploading(false)
  }

  const removePhoto = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    const newUrls = uploadedUrls.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    setUploadedUrls(newUrls)
    onUploaded(newUrls)
  }

  return (
    <div>
      <label className="block font-body text-xs text-muted uppercase tracking-wider mb-2">
        Proof Photos (Optional — max {maxPhotos})
      </label>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-accent/30">
              <img src={src} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <FiX size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons — only show if under max */}
      {previews.length < maxPhotos && (
        <div className="flex gap-2 flex-wrap">
          {/* Camera button — opens camera on mobile */}
          <button
            type="button"
            onClick={() => { fileInputRef.current!.setAttribute('capture', 'environment'); fileInputRef.current?.click() }}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-accent/40 bg-accent/5 text-dark font-body text-xs font-medium rounded-xl hover:border-accent hover:bg-accent/10 transition-all disabled:opacity-50"
          >
            <FiCamera size={15} className="text-accent" />
            {uploading ? 'Uploading...' : 'Take Photo'}
          </button>

          {/* Gallery button — pick from files */}
          <button
            type="button"
            onClick={() => { fileInputRef.current!.removeAttribute('capture'); fileInputRef.current?.click() }}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 bg-gray-50 text-muted font-body text-xs font-medium rounded-xl hover:border-primary hover:text-primary transition-all disabled:opacity-50"
          >
            <FiUpload size={14} />
            Choose File
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <p className="font-body text-xs text-muted mt-2">
        Photo of delivery lorry, material stack, or delivery challan as proof.
      </p>
    </div>
  )
}
