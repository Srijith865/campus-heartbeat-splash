
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"
import { FloatingHearts } from "@/components/ui/floating-hearts"
import { UsernameInput } from "@/components/ui/username-input"
import { PasswordInput } from "@/components/ui/password-input"
import { TagPicker } from "@/components/ui/tag-picker"
import { UploadSwipeDeck } from "@/components/ui/upload-swipe-deck"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Tag {
  id: string
  text: string
  isCustom: boolean
}

interface Photo {
  id: string
  file: File
  url: string
  status: 'pending' | 'kept' | 'discarded'
}

interface CreateAccountData {
  username: string
  email: string
  password: string
  confirmPassword: string
  bio: string
  personality: 'introvert' | 'extrovert' | 'ambivert' | ''
  interests: Tag[]
  photos: Photo[]
}

export const CreateAccount = () => {
  const navigate = useNavigate()
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [formData, setFormData] = useState<CreateAccountData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    personality: "",
    interests: [],
    photos: []
  })

  const keptPhotos = formData.photos.filter(p => p.status === 'kept')
  const isPasswordStrong = formData.password.length >= 8 && 
    /[a-z]/.test(formData.password) && 
    /[A-Z]/.test(formData.password) && 
    /[0-9]/.test(formData.password)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

  const isFormValid = 
    isUsernameAvailable &&
    isEmailValid &&
    isPasswordStrong &&
    passwordsMatch &&
    keptPhotos.length > 0 &&
    formData.personality &&
    formData.interests.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      if (!isUsernameAvailable) toast.error("Please choose an available username")
      else if (!isEmailValid) toast.error("Please enter a valid email address")
      else if (!isPasswordStrong) toast.error("Password must be stronger")
      else if (!passwordsMatch) toast.error("Passwords do not match")
      else if (keptPhotos.length === 0) toast.error("Please add at least one photo")
      else if (!formData.personality) toast.error("Please select your personality type")
      else if (formData.interests.length === 0) toast.error("Please add some interests")
      return
    }

    toast.success("Account created successfully! 🎉")
    console.log("Account created:", {
      ...formData,
      photos: keptPhotos.map(p => ({ name: p.file.name, size: p.file.size }))
    })
  }

  const handleInputChange = (field: keyof CreateAccountData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <FloatingHearts />
      
      <motion.div 
        className="w-full max-w-2xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="mr-4 glass-card hover:scale-110 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-premium bg-clip-text text-transparent">
            Create Your Account
          </h1>
        </motion.div>

        {/* Form Section */}
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Username */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <UsernameInput
              value={formData.username}
              onChange={(value) => handleInputChange('username', value)}
              onAvailabilityChange={setIsUsernameAvailable}
            />
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <FormInput
              variant="premium"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`${
                formData.email && !isEmailValid 
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                  : ''
              }`}
            />
            {formData.email && !isEmailValid && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-red-500 mt-2"
              >
                Please enter a valid email address
              </motion.p>
            )}
          </motion.div>

          {/* Password Fields */}
          <motion.div
            className="grid md:grid-cols-2 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <PasswordInput
              placeholder="Password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              showStrength={true}
            />
            <PasswordInput
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(value) => handleInputChange('confirmPassword', value)}
            />
          </motion.div>

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 text-sm"
            >
              <div className={`w-2 h-2 rounded-full ${passwordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={passwordsMatch ? 'text-green-500' : 'text-red-500'}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </span>
            </motion.div>
          )}

          {/* Photo Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4">Upload Photos</h3>
            <UploadSwipeDeck
              photos={formData.photos}
              onPhotosChange={(photos) => handleInputChange('photos', photos)}
            />
          </motion.div>

          {/* Personality Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4">Personality Type</h3>
            <div className="flex flex-wrap gap-3">
              {(['introvert', 'extrovert', 'ambivert'] as const).map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('personality', type)}
                  className={`glass-card rounded-full px-6 py-3 capitalize transition-all duration-300 ${
                    formData.personality === type 
                      ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_var(--primary)] scale-105' 
                      : 'hover:scale-105'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Interests */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <TagPicker
              selectedTags={formData.interests}
              onTagsChange={(tags) => handleInputChange('interests', tags)}
            />
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">About You</h3>
                <span className="text-sm text-foreground/60">{formData.bio.length}/300</span>
              </div>
              <textarea
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 300))}
                className="glass-input w-full rounded-2xl px-4 py-4 text-base transition-all duration-500 placeholder:text-foreground/50 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:shadow-glass resize-none h-32"
              />
            </div>
          </motion.div>

          {/* Submit Button */}
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
              disabled={!isFormValid}
            >
              Continue
            </Button>
            
            {!isFormValid && (
              <motion.p 
                className="text-center text-sm text-foreground/60 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Complete all fields to continue
              </motion.p>
            )}
          </motion.div>
        </motion.form>

        {/* Footer */}
        <motion.p 
          className="text-center text-sm text-foreground/60 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.6 }}
        >
          Already have an account?{" "}
          <button 
            onClick={() => navigate("/")}
            className="text-primary font-medium hover:underline transition-all duration-300"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  )
}
