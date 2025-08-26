
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Upload, Camera, Heart, X, Trash2, ZoomIn } from "lucide-react"
import { toast } from "sonner"
import { useKeyboard } from "@/hooks/use-keyboard"

interface Photo {
  id: string
  file: File
  url: string
  status: 'pending' | 'kept' | 'discarded'
}

interface UploadSwipeDeckProps {
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
}

export const UploadSwipeDeck = ({ photos, onPhotosChange }: UploadSwipeDeckProps) => {
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 0, 150], [-15, 0, 15])
  const opacity = useTransform(x, [-150, -50, 0, 50, 150], [0, 1, 1, 1, 0])

  const pendingPhotos = photos.filter(p => p.status === 'pending')
  const keptPhotos = photos.filter(p => p.status === 'kept')
  const currentPhoto = pendingPhotos[0]

  // Keyboard support
  useKeyboard({
    onLeftArrow: () => currentPhoto && handleSwipe(currentPhoto.id, 'left'),
    onRightArrow: () => currentPhoto && handleSwipe(currentPhoto.id, 'right'),
    onEscape: () => setPreviewPhoto(null),
    enabled: !!currentPhoto || !!previewPhoto
  })

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const url = URL.createObjectURL(file)
      
      const newPhoto: Photo = {
        id,
        file,
        url,
        status: 'pending'
      }

      onPhotosChange([...photos, newPhoto])
    })
  }, [photos, onPhotosChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handleSwipe = (photoId: string, direction: 'left' | 'right') => {
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId 
        ? { ...photo, status: direction === 'right' ? 'kept' as const : 'discarded' as const }
        : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(photo => photo.id !== photoId))
    URL.revokeObjectURL(photos.find(p => p.id === photoId)?.url || '')
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
          <p className="text-foreground/60 mb-6">Drag and drop photos here, or click to browse</p>
          
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

      {/* Swipe Deck */}
      {currentPhoto && (
        <div className="relative">
          <motion.div
            className="glass-card rounded-2xl overflow-hidden relative cursor-grab active:cursor-grabbing"
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={() => setDraggedPhoto(currentPhoto.id)}
            onDragEnd={(_, info: PanInfo) => {
              setDraggedPhoto(null)
              if (Math.abs(info.offset.x) > 100) {
                handleSwipe(currentPhoto.id, info.offset.x > 0 ? 'right' : 'left')
              }
            }}
            whileHover={{ scale: 1.02 }}
            animate={{ x: 0, rotate: 0 }}
          >
            <img
              src={currentPhoto.url}
              alt="Photo to review"
              className="w-full h-80 object-cover"
            />
            
            {/* Swipe Indicators */}
            <motion.div
              className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              style={{ opacity: useTransform(x, [0, 150], [0, 1]) }}
            >
              <div className="bg-green-500 rounded-full p-4">
                <Heart className="h-8 w-8 text-white fill-current" />
              </div>
            </motion.div>
            
            <motion.div
              className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
              style={{ opacity: useTransform(x, [-150, 0], [1, 0]) }}
            >
              <div className="bg-red-500 rounded-full p-4">
                <X className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewPhoto(currentPhoto)}
              className="absolute top-4 right-4 glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
              aria-label="Preview photo"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-6">
            <motion.button
              type="button"
              onClick={() => handleSwipe(currentPhoto.id, 'left')}
              className="glass-card rounded-full p-4 hover:scale-110 transition-all duration-200 text-red-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Discard photo"
            >
              <X className="h-6 w-6" />
            </motion.button>
            
            <motion.button
              type="button"
              onClick={() => handleSwipe(currentPhoto.id, 'right')}
              className="glass-card rounded-full p-4 hover:scale-110 transition-all duration-200 text-green-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Keep photo"
            >
              <Heart className="h-6 w-6" />
            </motion.button>
          </div>

          <p className="text-center text-sm text-foreground/60 mt-4">
            Swipe right to keep, left to discard • Use ← → arrow keys • {pendingPhotos.length} remaining
          </p>
        </div>
      )}

      {/* Kept Photos */}
      {keptPhotos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Selected Photos ({keptPhotos.length})</h4>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary hover:underline"
            >
              Add More
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {keptPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group glass-card rounded-xl overflow-hidden aspect-square"
                >
                  <img
                    src={photo.url}
                    alt={`Selected photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                    <motion.button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="opacity-0 group-hover:opacity-100 glass-card rounded-full p-2 hover:scale-110 transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </motion.button>
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
                src={previewPhoto.url}
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
