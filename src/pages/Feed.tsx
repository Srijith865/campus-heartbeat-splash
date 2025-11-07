
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { supabase } from '@/integrations/supabase/client'
import ProfileCard from '@/components/ProfileCard'
import MatchModal from '@/components/MatchModal'
import TopBar from '@/components/TopBar'
import { Users, Search, SkipForward } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getAIFeedSuggestions, getCompatibilityScore, Profile } from '@/services/aiService'
import { searchProfiles, SearchResult } from '@/services/searchService'
import { showMatchNotification, showRatingNotification, setupMatchNotifications } from '@/services/notificationService'
import SearchDropdown from '@/components/SearchDropdown'

const Feed: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [isSkipping, setIsSkipping] = useState(false)

  useEffect(() => {
    fetchCurrentUserAndProfiles()
  }, [])


  const fetchCurrentUserAndProfiles = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Get current user's profile
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile setup",
          variant: "destructive"
        })
        navigate('/create-account')
        return
      }

      if (!profile?.gender) {
        toast({
          title: "Profile incomplete",
          description: "Please set your gender in your profile",
          variant: "destructive"
        })
        navigate('/account')
        return
      }

      // Transform current user profile for AI service
      const currentProfile: Profile = {
        id: profile.id,
        username: profile.username,
        main_photo_url: profile.main_photo_url,
        interests: Array.isArray(profile.interests)
          ? profile.interests.map((interest: any) =>
              typeof interest === 'string' ? interest : interest.text
            )
          : [],
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        personality: profile.personality
      }

      setCurrentUserGender(profile.gender)
      setCurrentUserId(profile.id)
      setCurrentUserProfile(currentProfile)
      
      // Setup realtime after we have the user ID
      setupMatchNotifications(profile.id)

      // Fetch all opposite gender profiles for AI analysis
      const oppositeGender = profile.gender === 'male' ? 'female' : 'male'
      
      const { data: ratedProfiles } = await (supabase as any)
        .from('ratings')
        .select('rated_id')
        .eq('rater_id', user.id)

      const ratedIds = ratedProfiles?.map((r: any) => r.rated_id) || []

      const { data: allOppositeProfiles, error } = await (supabase as any)
        .from('profiles')
        .select('id, username, main_photo_url, interests, bio, gender, age, personality')
        .eq('gender', oppositeGender)
        .eq('is_visible', true)
        .eq('is_active', true)
        .not('id', 'in', `(${[user.id, ...ratedIds].join(',')})`)
      if (error) throw error

      // Transform interests from Tag objects to strings
      const transformedProfiles = (allOppositeProfiles || []).map((profile: any) => ({
        ...profile,
        interests: Array.isArray(profile.interests) 
          ? profile.interests.map((interest: any) => 
              typeof interest === 'string' ? interest : interest.text
            )
          : []
      }))

      // Store all profiles for search
      setAllProfiles(transformedProfiles)

      // Use AI to get personalized suggestions
      const aiSuggestions = getAIFeedSuggestions(currentProfile, transformedProfiles)

      // If AI suggestions are available, use them; otherwise fall back to random selection
      const finalProfiles = aiSuggestions.length > 0
        ? aiSuggestions
        : transformedProfiles.slice(0, 20)

      setProfiles(finalProfiles)
    } catch (error: any) {
      console.error('Error fetching profiles:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    // Perform search using Cursor-powered backend
    const results = searchProfiles(query, allProfiles)
    setSearchResults(results)

    // If we have search results, show them instead of the regular feed
    if (results.length > 0) {
      const searchProfiles = results.map(result => result.profile)
      setProfiles(searchProfiles)
      setCurrentIndex(0)
    }

    setIsSearching(false)
  }

  const handleSkip = () => {
    if (isSkipping || currentIndex >= profiles.length - 1) return

    setIsSkipping(true)

    // Animate skip and move to next profile
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsSkipping(false)
    }, 300)
  }

  const handleSwipe = (event: any, info: PanInfo) => {
    const threshold = 50
    const velocity = info.velocity.x

    // Swipe left to skip (negative velocity)
    if (velocity < -threshold) {
      handleSkip()
    }
  }

  const handleProfileSelect = (profileId: string, username: string) => {
    // Navigate to profile page
    navigate(`/profile/${username}`)
  }
  const handleRating = async (profileId: string, rating: number) => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to rate profiles",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Call the edge function to handle rating logic securely
      const { data, error } = await supabase.functions.invoke('handle-rating', {
        body: {
          rated_id: profileId,
          rating_value: rating,
        },
      })

      if (error) throw error

      // If it's a match, show the match modal
      if (data.matched) {
        const matchedProfile = profiles[currentIndex]
        // chat feature start - include matchId in matched profile
        setMatchedProfile({
          ...matchedProfile,
          matchId: data.matchId
        } as any)
        // chat feature end

        showMatchNotification(matchedProfile.username, data.matchId)
      } else if (data.shouldNotify) {
        showRatingNotification(profiles[currentIndex].username, rating)
      } else {
        toast({
          title: "Rating Submitted",
          description: "Your rating has been recorded",
        })
      }

      // Move to next profile
      setCurrentIndex((prev) => prev + 1)
    } catch (error: any) {
      console.error('Error handling rating:', error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentProfile = profiles[currentIndex]
  const hasMoreProfiles = currentIndex < profiles.length

  return (
    <div className="min-h-screen bg-gradient-background">
      <TopBar
        avatarUrl={undefined}
        onProfileClick={() => navigate('/account')}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-8">
        {/* Search Bar */}
        <div className="max-w-md w-full mb-6">
          <SearchDropdown
            onProfileSelect={handleProfileSelect}
            className="w-full"
          />
          {hasMoreProfiles && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Swipe left to skip • Tap stars to rate
            </p>
          )}
        </div>

        <div className="w-full max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <ProfileCard
                key="loading"
                profile={{ id: 'loading', username: 'Loading...' }}
                isLoading={true}
                onRate={() => {}}
              />
            ) : hasMoreProfiles ? (
              <motion.div
                key={currentProfile.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleSwipe}
                className="relative"
              >
                <ProfileCard
                  profile={currentProfile}
                  onRate={handleRating}
                  currentUserProfile={currentUserProfile}
                  currentUserId={currentUserId}
                  onBookmarkChange={() => {
                    // Refresh bookmarks if needed
                    console.log('Bookmark changed for profile:', currentProfile.id)
                  }}
                />

                {/* Skip Button for Desktop */}
                <Button
                  onClick={handleSkip}
                  disabled={isSkipping || currentIndex >= profiles.length - 1}
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-16 z-20 bg-white/90 backdrop-blur-sm hover:bg-white"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="text-center p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gradient-card rounded-3xl p-8 shadow-card border border-border">
                  <div className="mb-4">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
                  <p className="text-muted-foreground mb-4">
                    Check back later for new profiles
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MatchModal
        matchedProfile={matchedProfile}
        onClose={() => setMatchedProfile(null)}
      />
    </div>
  )
}

export default Feed

/*
Integration example:

// In App.tsx routes:
<Route path="/feed" element={<Feed />} />

// Or with pre-loaded profiles:
<Feed profiles={preLoadedProfiles} />

// TODO: Connect to Supabase:
// 1. Fetch profiles excluding current user
// 2. Record swipes in database
// 3. Check for mutual likes (matches)
// 4. Handle real-time match notifications
*/
