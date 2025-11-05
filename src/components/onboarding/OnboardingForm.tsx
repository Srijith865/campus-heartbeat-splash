
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"
import { 
  FormSelect, 
  FormSelectContent, 
  FormSelectItem, 
  FormSelectTrigger, 
  FormSelectValue 
} from "@/components/ui/form-select"
import { FloatingHearts } from "@/components/ui/floating-hearts"
import { toast } from "sonner"
import heartLogo from "@/assets/heart-logo.png"

interface FormData {
  name: string
  age: string
  gender: string
}

export const OnboardingForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Please enter your name")
      return
    }
    
    if (!formData.age || parseInt(formData.age) < 17 || parseInt(formData.age) > 100) {
      toast.error("Please enter a valid age (17-100)")
      return
    }
    
    if (!formData.gender) {
      toast.error("Please select your gender")
      return
    }

    toast.success("Welcome to the app! 💕")
    
    // Navigate to create account page
    setTimeout(() => {
      navigate("/create-account")
    }, 1000)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <FloatingHearts />
      
      <motion.div 
        className="w-full max-w-md mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          >
            <motion.img
              src={heartLogo}
              alt="Campus Cupid Logo"
              className="w-28 h-28 mx-auto drop-shadow-2xl"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 2, -2, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold bg-gradient-premium bg-clip-text text-transparent mb-3 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Campus Cupid
          </motion.h1>
          <motion.p 
            className="text-foreground/70 text-lg font-light tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            Connect with amazing people on campus
          </motion.p>
        </motion.div>

        {/* Form Section */}
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <FormInput
              variant="premium"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="text-center"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <FormInput
              variant="premium"
              type="number"
              placeholder="Your age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              min="17"
              max="100"
              className="text-center"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            <FormSelect value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <FormSelectTrigger className="text-center">
                <FormSelectValue placeholder="Select your gender" />
              </FormSelectTrigger>
              <FormSelectContent>
                <FormSelectItem value="male">Male</FormSelectItem>
                <FormSelectItem value="female">Female</FormSelectItem>
                <FormSelectItem value="other">Other</FormSelectItem>
              </FormSelectContent>
            </FormSelect>
          </motion.div>

          <motion.div
            className="pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
          >
            <Button 
              type="submit" 
              variant="premium" 
              size="xl" 
              className="w-full"
            >
              Get Started
            </Button>
          </motion.div>
        </motion.form>

        {/* Login Link */}
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.6 }}
        >
          <p className="text-sm text-foreground/60">
            Already have an account?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary-light"
            >
              Login
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p 
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          Ready to find love on campus? 💕
        </motion.p>
      </motion.div>
    </div>
  )
}
