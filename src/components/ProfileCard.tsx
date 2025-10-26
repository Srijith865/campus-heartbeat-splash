import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Bookmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getCompatibilityScore } from '@/services/aiService'
import { toggleBookmark, isBookmarked as checkBookmarkStatus } from '@/services/bookmarkService'
import { showBookmarkNotification } from '@/services/notificationService'

interface Profile {
  id: string
  username: string
  main_photo_url?: string
  interests?: string[]
  bio?: string
  age?: number
}

interface ProfileCardProps {
  profile: Profile
  onRate: (profileId: string, rating: number) => void
  isLoading?: boolean
  currentUserProfile?: Profile
  currentUserId?: string
  onBookmarkChange?: () => void
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onRate,
  isLoading = false,
  currentUserProfile,
  currentUserId,
  onBookmarkChange
}) => {
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { toast } = useToast()

  // Calculate AI compatibility score
  const compatibilityScore = currentUserProfile
    ? getCompatibilityScore(currentUserProfile, profile)
    : Math.floor(Math.random() * 30) + 70

  // Check initial bookmark status
  useEffect(() => {
    if (currentUserId && profile.id) {
      checkBookmarkStatus(currentUserId, profile.id).then(setIsBookmarked)
    }
  }, [currentUserId, profile.id])

  const handleBookmark = async () => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to bookmark profiles",
        variant: "destructive"
      })
      return
    }

    try {
      const success = await toggleBookmark(currentUserId, profile.id)
      if (success) {
        const newBookmarkStatus = !isBookmarked
        setIsBookmarked(newBookmarkStatus)

        showBookmarkNotification(newBookmarkStatus, profile.username)

        // Notify parent component of bookmark change
        if (onBookmarkChange) {
          onBookmarkChange()
        }
      } else {
        throw new Error('Failed to update bookmark')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <motion.div
        className="relative w-full max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-card rounded-3xl shadow-card border border-border overflow-hidden">
          <Skeleton className="w-full aspect-[3/4]" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face'

  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-card rounded-3xl shadow-card border border-border overflow-hidden">
        {/* Profile Photo */}
        <div className="relative w-full aspect-[3/4]">
          <img
            src={profile.main_photo_url || fallbackImage}
            alt={`${profile.username}'s profile`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className="absolute top-4 right-4 z-10 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
            aria-label="Bookmark profile"
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-white' : ''} text-white`} />
          </button>

          {/* Compatibility Score Badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {compatibilityScore}% Match
            </Badge>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold">{profile.username}</h2>
            {profile.age && (
              <span className="text-xl text-muted-foreground">{profile.age}</span>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-muted-foreground line-clamp-3">{profile.bio}</p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 6).map((interest, index) => (
                <Badge key={index} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          )}

          {/* Rating Bar */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Rate this profile (1-10)
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onRate(profile.id, rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="group relative"
                  aria-label={`Rate ${rating} stars`}
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      rating <= (hoveredRating || 0)
                        ? 'fill-primary text-primary scale-110'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {rating}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileCard
