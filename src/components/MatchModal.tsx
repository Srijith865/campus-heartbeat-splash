
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { X, MessageCircle } from 'lucide-react'

interface MatchedProfile {
  id: string
  username: string
  main_photo_url?: string
  matchId?: string
}

interface MatchModalProps {
  matchedProfile: MatchedProfile | null
  onClose: () => void
}

const MatchModal: React.FC<MatchModalProps> = ({ matchedProfile, onClose }) => {
  const navigate = useNavigate()

  // chat feature start
  const handleStartChat = () => {
    if (matchedProfile?.matchId) {
      navigate(`/chats`)
      onClose()
    }
  }
  // chat feature end

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (matchedProfile) {
      document.addEventListener('keydown', handleEscape)
      // Prevent background scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [matchedProfile, onClose])

  const imageUrl = matchedProfile?.main_photo_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'

  return (
    <AnimatePresence>
      {matchedProfile && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal content */}
          <motion.div
            className="relative bg-gradient-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-card border border-border"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Match content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 id="match-title" className="text-3xl font-bold text-primary mb-2">
                It's a Match! 🎉
              </h2>
              
              <p className="text-muted-foreground mb-6">
                You and {matchedProfile.username} liked each other
              </p>

              {/* Profile avatar */}
              <div className="mb-6">
                <img
                  src={imageUrl}
                  alt={`${matchedProfile.username}'s profile photo`}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-primary shadow-soft"
                />
                <h3 className="text-xl font-semibold mt-3">
                  {matchedProfile.username}
                </h3>
              </div>

              {/* chat feature start - CTA Buttons */}
              <div className="space-y-2 w-full">
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Keep Browsing
                </Button>
              </div>
              {/* chat feature end */}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MatchModal

/*
Usage example:

const [matchedProfile, setMatchedProfile] = useState(null)

<MatchModal
  matchedProfile={matchedProfile}
  onClose={() => setMatchedProfile(null)}
/>
*/
