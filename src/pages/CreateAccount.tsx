
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"
import { FloatingHearts } from "@/components/ui/floating-hearts"
import { UsernameInput } from "@/components/ui/username-input"
import { PasswordInput } from "@/components/ui/password-input"
import { TagPicker } from "@/components/ui/tag-picker"
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface Tag {
  id: string
  text: string
  isCustom: boolean
}

interface CreateAccountData {
  username: string
  email: string
  password: string
  confirmPassword: string
  bio: string
  age: string
  personality: 'introvert' | 'extrovert' | 'ambivert' | ''
  gender: 'male' | 'female' | ''
  interests: Tag[]
  photos: string[]
}

export const CreateAccount = () => {
  const navigate = useNavigate()
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateAccountData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    age: "",
    personality: "",
    gender: "",
    interests: [],
    photos: []
  })

  // Updated password strength validation - more lenient
  const isPasswordStrong = formData.password.length >= 8 && 
    /[a-zA-Z]/.test(formData.password) && 
    /[0-9]/.test(formData.password)
  
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  const isBioValid = formData.bio.trim().length >= 1 // Only require 1 character

  // Updated form validation logic
  const isAgeValid = formData.age !== '' && parseInt(formData.age) >= 17 && parseInt(formData.age) <= 100
  
  const isFormValid = 
    formData.username.trim().length > 0 &&
    isUsernameAvailable &&
    isEmailValid &&
    isPasswordStrong &&
    passwordsMatch &&
    formData.photos.length > 0 &&
    formData.personality !== '' &&
    formData.interests.length > 0 &&
    isBioValid &&
    isAgeValid

  // Debug logging for validation state
  const validationState = {
    hasUsername: formData.username.trim().length > 0,
    isUsernameAvailable,
    isEmailValid,
    isPasswordStrong,
    passwordsMatch,
    hasPhotos: formData.photos.length > 0,
    hasPersonality: formData.personality !== '',
    hasInterests: formData.interests.length > 0,
    isBioValid,
    isFormValid
  }
  
  console.log("Final validation state:", validationState)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      if (!formData.username.trim()) toast.error("Please enter your username")
      else if (!isUsernameAvailable) toast.error("Please choose an available username")
      else if (!isEmailValid) toast.error("Please enter a valid email address")
      else if (!isPasswordStrong) toast.error("Password must be at least 8 characters with letters and numbers")
      else if (!passwordsMatch) toast.error("Passwords do not match")
      else if (formData.photos.length === 0) toast.error("Please add at least one photo")
      else if (!formData.gender) toast.error("Please select your gender")
      else if (!formData.personality) toast.error("Please select your personality type")
      else if (formData.interests.length === 0) toast.error("Please add at least one interest")
      else if (!isBioValid) toast.error("Please write something about yourself")
      else if (!isAgeValid) toast.error("Please enter a valid age (17-100)")
      return
    }

    setIsSubmitting(true)

    try {
      // Get the main photo URL (first photo)
      const mainPhotoUrl = formData.photos[0] || null

      // Create account with Supabase Auth - profile will be created by trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/feed`,
          data: {
            username: formData.username,
            bio: formData.bio,
            age: formData.age,
            personality: formData.personality,
            gender: formData.gender,
            interests: JSON.stringify(formData.interests),
            photos: formData.photos,
            main_photo_url: mainPhotoUrl
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.session) {
          // User is auto-confirmed and logged in
          toast.success("Account created successfully! 🎉")
          console.log("Account created with photos:", formData.photos)
          
          // Navigate to feed page after successful account creation
          setTimeout(() => {
            navigate("/feed")
          }, 1500)
        } else {
          // Email confirmation is required
          toast.success("Account created! Please check your email to confirm your account.")
          setTimeout(() => {
            navigate("/login")
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error("Account creation error:", error)
      toast.error(error.message || "Failed to create account. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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
            disabled={isSubmitting}
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

          {/* Age */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <FormInput
              variant="premium"
              type="number"
              placeholder="Your age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              min="17"
              max="100"
              className={`${
                formData.age && !isAgeValid 
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                  : ''
              }`}
            />
            {formData.age && !isAgeValid && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-red-500 mt-2"
              >
                Age must be between 17 and 100
              </motion.p>
            )}
          </motion.div>

          {/* Photo Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4">Upload Photos</h3>
            <CloudinaryUpload
              photos={formData.photos}
              onPhotosChange={(photos) => handleInputChange('photos', photos)}
              maxPhotos={6}
            />
          </motion.div>

          {/* Gender */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4">Gender</h3>
            <div className="flex flex-wrap gap-3">
              {(['male', 'female'] as const).map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('gender', type)}
                  className={`glass-card rounded-full px-6 py-3 capitalize transition-all duration-300 ${
                    formData.gender === type 
                      ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_var(--primary)] scale-105' 
                      : 'hover:scale-105'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Personality Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              {!isBioValid && formData.bio.length === 0 && (
                <p className="text-sm text-red-500">Please write at least one character about yourself</p>
              )}
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
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
            
            {!isFormValid && !isSubmitting && (
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
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
    </div>
  )
}
