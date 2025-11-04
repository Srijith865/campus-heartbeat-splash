import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, MessageCircle, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/services/aiService'
import { getCompatibilityScore } from '@/services/aiService'
import TopBar from '@/components/TopBar'

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (username) {
      fetchProfile(username)
      fetchCurrentUser()
    }
  }, [username])

  const fetchProfile = async (profileUsername: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileUsername)
        .eq('is_active', true)
        .eq('is_visible', true)
        .single()

      if (error) throw error

      if (data) {
        const profileData: Profile = {
          id: data.id,
          username: data.username,
          main_photo_url: data.main_photo_url,
          interests: Array.isArray(data.interests) 
            ? data.interests.map((interest: any) => 
                typeof interest === 'string' ? interest : interest.text
              )
            : [],
          bio: data.bio,
          age: data.age,
          gender: data.gender,
          personality: data.personality
        }
        setProfile(profileData)
      }
    } catch (error) {
      toast({
        title: "Profile not found",
        description: "This profile doesn't exist or is not available",
        variant: "destructive"
      })
      navigate('/feed')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          const currentProfile: Profile = {
            id: profileData.id,
            username: profileData.username,
            main_photo_url: profileData.main_photo_url,
            interests: Array.isArray(profileData.interests) 
              ? profileData.interests.map((interest: any) => 
                  typeof interest === 'string' ? interest : interest.text
                )
              : [],
            bio: profileData.bio,
            age: profileData.age,
            gender: profileData.gender,
            personality: profileData.personality
          }
          setCurrentUserProfile(currentProfile)
        }
      }
    } catch (error) {
      // Error fetching current user
    }
  }

  const handleBookmark = async () => {
    // Bookmark functionality temporarily disabled
    toast({
      title: "Coming Soon",
      description: "Bookmark feature will be available soon!",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <TopBar onProfileClick={() => navigate('/account')} />
        <main className="container max-w-2xl mx-auto px-4 pt-24 pb-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <Button onClick={() => navigate('/feed')}>
            Back to Feed
          </Button>
        </div>
      </div>
    )
  }

  const compatibilityScore = currentUserProfile 
    ? getCompatibilityScore(currentUserProfile, profile)
    : 0

  return (
    <div className="min-h-screen bg-gradient-background">
      <TopBar onProfileClick={() => navigate('/account')} />
      
      <main className="container max-w-2xl mx-auto px-4 pt-24 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/feed')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-3xl shadow-card border border-border overflow-hidden"
        >
          {/* Profile Photo */}
          <div className="relative w-full aspect-[3/4]">
            <img
              src={profile.main_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face'}
              alt={`${profile.username}'s profile`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className="absolute top-4 right-4 z-10 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-white' : ''} text-white`} />
            </button>

            {/* Compatibility Score */}
            {compatibilityScore > 0 && (
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  {compatibilityScore}% Match
                </Badge>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-6 space-y-4">
            <div className="flex items-baseline gap-2">
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              {profile.age && (
                <span className="text-xl text-muted-foreground">{profile.age}</span>
              )}
            </div>
            
            {profile.bio && (
              <p className="text-muted-foreground">{profile.bio}</p>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => navigate('/feed')}
                className="flex-1"
                size="lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                Rate Profile
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => navigate('/chats')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                View Chats
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default ProfilePage

