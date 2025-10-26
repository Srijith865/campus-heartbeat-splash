
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { FormInput } from "./form-input"

interface PasswordInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  showStrength?: boolean
}

const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
  if (!password) return { score: 0, text: "", color: "" }
  
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  const levels = [
    { text: "Very Weak", color: "bg-red-500" },
    { text: "Weak", color: "bg-orange-500" },
    { text: "Fair", color: "bg-yellow-500" },
    { text: "Good", color: "bg-green-500" },
    { text: "Strong", color: "bg-emerald-500" }
  ]
  
  return { score, ...levels[Math.min(score - 1, 4)] }
}

export const PasswordInput = ({ placeholder, value, onChange, showStrength = false }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const strength = useMemo(() => getPasswordStrength(value), [value])

  return (
    <div className="space-y-3">
      <div className="relative">
        <FormInput
          variant="premium"
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {showStrength && value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Password Strength</span>
            <span className={`font-medium ${strength.score >= 4 ? 'text-green-500' : strength.score >= 3 ? 'text-yellow-500' : 'text-red-500'}`}>
              {strength.text}
            </span>
          </div>
          
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-foreground/10'}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
