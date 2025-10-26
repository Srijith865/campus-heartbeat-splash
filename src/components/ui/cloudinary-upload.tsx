
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Camera, X, Trash2, ZoomIn } from "lucide-react"
import { toast } from "sonner"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface CloudinaryUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
}

export const CloudinaryUpload = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 6 
}: CloudinaryUploadProps) => {
  const [uploading, setUploading] = useState<string[]>([])
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return

    const filesToUpload = Array.from(files).slice(0, maxPhotos - photos.length)
    
    if (filesToUpload.length === 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    console.log(`Starting upload of ${filesToUpload.length} files`)

    const uploadPromises = filesToUpload.map(async (file, index) => {
      console.log(`Processing file ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      })

      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type)
        toast.error(`${file.name} is not an image file`)
        return null
      }

      if (file.size > 10 * 1024 * 1024) {
        console.error('File too large:', file.size)
        toast.error(`${file.name} is too large (max 10MB)`)
        return null
      }

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      try {
        console.log(`Starting upload for file ${index + 1} with ID:`, fileId)
        setUploading(prev => [...prev, fileId])
        
        const url = await uploadToCloudinary(file)
        console.log(`Upload successful for file ${index + 1}:`, url)
        
        setUploading(prev => prev.filter(id => id !== fileId))
        return url
      } catch (error) {
        console.error(`Upload failed for file ${index + 1}:`, error)
        setUploading(prev => prev.filter(id => id !== fileId))
        toast.error(`Failed to upload ${file.name}. Please try again.`)
        return null
      }
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    const successfulUploads = uploadedUrls.filter((url): url is string => url !== null)
    
    console.log(`Upload results: ${successfulUploads.length}/${filesToUpload.length} successful`)
    
    if (successfulUploads.length > 0) {
      onPhotosChange([...photos, ...successfulUploads])
      toast.success(`${successfulUploads.length} photo(s) uploaded successfully!`)
    }
  }, [photos, onPhotosChange, maxPhotos])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    console.log('Files dropped:', e.dataTransfer.files.length)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
    toast.success('Photo removed')
  }

  const moveToFirst = (index: number) => {
    const newPhotos = [...photos]
    const [movedPhoto] = newPhotos.splice(index, 1)
    newPhotos.unshift(movedPhoto)
    onPhotosChange(newPhotos)
    toast.success('Main photo updated')
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          className="glass-card rounded-2xl p-8 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 text-center"
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Photos</h3>
          <p className="text-foreground/60 mb-6">
            Upload up to {maxPhotos} photos. First photo will be your main photo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-card px-6 py-3 rounded-xl hover:scale-105 transition-all duration-200"
            >
              Choose Files
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="glass-card px-6 py-3 rounded-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Your Photos ({photos.length}/{maxPhotos})</h4>
            {photos.length < maxPhotos && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary hover:underline"
              >
                Add More
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {photos.map((photoUrl, index) => (
                <motion.div
                  key={photoUrl}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group glass-card rounded-xl overflow-hidden aspect-square"
                >
                  <img
                    src={photoUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                      <motion.button
                        type="button"
                        onClick={() => setPreviewPhoto(photoUrl)}
                        className="glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Preview photo"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </motion.button>
                      
                      {index !== 0 && (
                        <motion.button
                          type="button"
                          onClick={() => moveToFirst(index)}
                          className="glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Set as main photo"
                        >
                          <Upload className="h-4 w-4 text-blue-500" />
                        </motion.button>
                      )}

                      <motion.button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Remove photo"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </motion.button>
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary rounded-full px-2 py-1 text-xs text-white">
                      Main
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Upload Progress */}
          {uploading.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-foreground/60">
                Uploading {uploading.length} photo(s)...
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploading.map((uploadId) => (
                  <div key={uploadId} className="aspect-square bg-muted rounded-xl animate-pulse flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground animate-bounce" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden inputs for additional uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        aria-label="Upload photos"
      />

      {/* Preview Modal */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-2xl max-h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewPhoto}
                alt="Preview"
                className="w-full h-full object-contain rounded-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
