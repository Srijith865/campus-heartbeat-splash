
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Loader2 } from "lucide-react"
import { FormInput } from "./form-input"

interface UsernameInputProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange: (available: boolean) => void
}

// Mock usernames for demo - replace with actual API call
const mockTakenUsernames = ["john_doe", "sarah_m", "alex123", "emma_wilson", "mike_johnson"]

const generateSuggestions = (username: string): string[] => {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return [
    `${base}_${Math.floor(Math.random() * 999)}`,
    `${base}${new Date().getFullYear()}`,
    `${base}_official`
  ]
}

export const UsernameInput = ({ value, onChange, onAvailabilityChange }: UsernameInputProps) => {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!value || value.length < 3) {
      setIsAvailable(null)
      setSuggestions([])
      onAvailabilityChange(false)
      return
    }

    setIsChecking(true)
    
    const checkAvailability = setTimeout(() => {
      const isTaken = mockTakenUsernames.includes(value.toLowerCase())
      setIsAvailable(!isTaken)
      onAvailabilityChange(!isTaken)
      
      if (isTaken) {
        setSuggestions(generateSuggestions(value))
      } else {
        setSuggestions([])
      }
      
      setIsChecking(false)
    }, 400)

    return () => clearTimeout(checkAvailability)
  }, [value, onAvailabilityChange])

  return (
    <div className="space-y-3">
      <div className="relative">
        <FormInput
          variant="premium"
          type="text"
          placeholder="Choose a username"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {isChecking && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
              </motion.div>
            )}
            
            {!isChecking && isAvailable === true && (
              <motion.div
                key="available"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Check className="h-5 w-5 text-green-500" />
              </motion.div>
            )}
            
            {!isChecking && isAvailable === false && (
              <motion.div
                key="taken"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <X className="h-5 w-5 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {!isChecking && isAvailable === false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-sm text-red-500">This username is already taken.</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-foreground/60">Try:</span>
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onChange(suggestion)}
                  className="px-3 py-1 text-sm glass-card rounded-full hover:scale-105 transition-all duration-200 text-primary"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
