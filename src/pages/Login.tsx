
import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"
import { PasswordInput } from "@/components/ui/password-input"
import { FloatingHearts } from "@/components/ui/floating-hearts"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { UserCheck } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  })
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [deactivatedUserId, setDeactivatedUserId] = useState<string | null>(null)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrUsername)
  const isUsernameValid = formData.emailOrUsername.length >= 3 && !/\s/.test(formData.emailOrUsername)
  const isInputValid = isEmailValid || isUsernameValid
  const isFormValid = isInputValid && formData.password.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      if (!isInputValid) {
        toast.error("Please enter a valid email or username")
      } else if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters")
      }
      return
    }

    try {
      let emailToUse = formData.emailOrUsername

      // If input is not an email, treat it as username and fetch email from profiles
      if (!isEmailValid) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', formData.emailOrUsername)
          .maybeSingle()

        if (profileError) {
          console.error("Profile lookup error:", profileError)
          toast.error("Error looking up username. Please try again.")
          return
        }

        if (!profileData) {
          toast.error("Username not found. Please check your username.")
          return
        }

        if (!profileData.email) {
          toast.error("Email not found for this username. Please use your email to login.")
          return
        }

        emailToUse = profileData.email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: formData.password
      })

      if (error) throw error

      // Check if the account is deactivated
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .single()

        if (!profileError && profile && !profile.is_active) {
          setDeactivatedUserId(data.user.id)
          setShowReactivateDialog(true)
          return
        }
      }

      toast.success("Welcome back! 🎉")
      
      // Redirect to feed page after successful login
      setTimeout(() => {
        navigate("/feed")
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "Failed to login. Please check your credentials.")
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleReactivate = async () => {
    if (!deactivatedUserId) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', deactivatedUserId)

      if (error) throw error

      toast.success("Welcome back! Your account has been reactivated 🎉")

      setShowReactivateDialog(false)
      
      setTimeout(() => {
        navigate('/feed')
      }, 1000)
    } catch (error: any) {
      toast.error("Failed to reactivate account. Please try again.")
    }
  }

  const handleCancelReactivation = async () => {
    await supabase.auth.signOut()
    setShowReactivateDialog(false)
    setDeactivatedUserId(null)
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
        {/* Login Card */}
        <motion.div
          className="glass-card rounded-3xl p-8 shadow-card backdrop-blur-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-premium bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-foreground/60 text-sm">
              Login to continue to Campus Cupid
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {/* Email or Username Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <FormInput
                variant="premium"
                type="text"
                placeholder="Email or username"
                value={formData.emailOrUsername}
                onChange={(e) => handleInputChange('emailOrUsername', e.target.value)}
                className={`${
                  formData.emailOrUsername && !isInputValid 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                    : ''
                }`}
              />
              {formData.emailOrUsername && !isInputValid && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-red-500 mt-2"
                >
                  Please enter a valid email or username
                </motion.p>
              )}
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <PasswordInput
                placeholder="Password"
                value={formData.password}
                onChange={(value) => handleInputChange('password', value)}
              />
            </motion.div>

            {/* Login Button */}
            <motion.div
              className="pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <Button 
                type="submit" 
                variant="premium" 
                size="xl" 
                className="w-full"
                disabled={!isFormValid}
              >
                Login
              </Button>
            </motion.div>
          </motion.form>

          {/* Sign Up Link */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <p className="text-sm text-foreground/60">
              Don't have an account?{" "}
              <button 
                onClick={() => navigate("/create-account")}
                className="text-primary font-medium hover:underline transition-all duration-300 hover:text-primary-light"
              >
                Sign up
              </button>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Reactivation Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent className="max-w-md border-border/50">
          <AlertDialogHeader>
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <AlertDialogTitle className="text-center text-2xl">
              Welcome Back!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p className="text-base text-foreground/80">
                Your account was deactivated, but we're glad to see you again.
              </p>
              <p className="text-sm text-muted-foreground">
                Would you like to reactivate your account and restore full access to all features?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-4">
            <Button
              onClick={handleReactivate}
              variant="premium"
              size="lg"
              className="w-full"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Reactivate My Account
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelReactivation}
              className="w-full"
            >
              Not Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
