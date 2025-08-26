
import { useState, useRef } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { X, Plus } from "lucide-react"
import { FormInput } from "./form-input"

interface Tag {
  id: string
  text: string
  isCustom: boolean
}

interface TagPickerProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  maxTags?: number
}

const suggestedTags = [
  "Music", "Sports", "Coding", "Movies", "Art", "Gaming", "Food", "Travel",
  "StudyGroups", "Photography", "Fitness", "Reading", "Dancing", "Hiking",
  "Tech", "Fashion", "Coffee", "Anime", "Cooking", "Yoga"
]

export const TagPicker = ({ selectedTags, onTagsChange, maxTags = 12 }: TagPickerProps) => {
  const [customInput, setCustomInput] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (text: string, isCustom = false) => {
    if (selectedTags.length >= maxTags) return
    if (selectedTags.some(tag => tag.text.toLowerCase() === text.toLowerCase())) return
    if (text.length < 2 || text.length > 24) return

    const newTag: Tag = {
      id: Date.now().toString(),
      text,
      isCustom
    }

    onTagsChange([...selectedTags, newTag])
    setCustomInput("")
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId))
  }

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      addTag(customInput.trim(), true)
      setShowCustomInput(false)
    }
  }

  const filteredSuggestions = suggestedTags.filter(
    tag => !selectedTags.some(selected => selected.text.toLowerCase() === tag.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Reorder.Group 
          axis="x" 
          values={selectedTags} 
          onReorder={onTagsChange}
          className="flex flex-wrap gap-2"
        >
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <Reorder.Item
                key={tag.id}
                value={tag}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                whileDrag={{ scale: 1.05, zIndex: 1000 }}
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass-card rounded-full px-4 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                >
                  <span className="text-sm font-medium">{tag.text}</span>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                    aria-label={`Remove ${tag.text} tag`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Suggested Tags */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground/80">Interests</h4>
          <span className="text-xs text-foreground/50">{selectedTags.length}/{maxTags}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.slice(0, 12).map((tag) => (
            <motion.button
              key={tag}
              onClick={() => addTag(tag)}
              disabled={selectedTags.length >= maxTags}
              className="glass-card rounded-full px-4 py-2 text-sm hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: selectedTags.length < maxTags ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              {tag}
            </motion.button>
          ))}

          {/* Add Custom Tag Button */}
          {!showCustomInput && selectedTags.length < maxTags && (
            <motion.button
              onClick={() => {
                setShowCustomInput(true)
                setTimeout(() => inputRef.current?.focus(), 100)
              }}
              className="glass-card rounded-full px-4 py-2 text-sm hover:scale-105 transition-all duration-200 flex items-center gap-2 text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-3 w-3" />
              Add Tag
            </motion.button>
          )}
        </div>

        {/* Custom Tag Input */}
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <FormInput
                ref={inputRef}
                variant="premium"
                type="text"
                placeholder="Create custom tag (2-24 chars)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCustomSubmit()
                  } else if (e.key === "Escape") {
                    setShowCustomInput(false)
                    setCustomInput("")
                  }
                }}
                maxLength={24}
                className="text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCustomSubmit}
                  disabled={customInput.length < 2}
                  className="px-3 py-1 text-xs glass-card rounded-full hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false)
                    setCustomInput("")
                  }}
                  className="px-3 py-1 text-xs glass-card rounded-full hover:scale-105 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
