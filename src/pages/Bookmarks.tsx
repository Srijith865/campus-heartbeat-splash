import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookmarkX, Heart } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/services/aiService'
import ProfileCard from '@/components/ProfileCard'
import { motion, AnimatePresence } from 'framer-motion'

const Bookmarks = () => {
  const navigate = useNavigate()
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      setCurrentUserId(user.id)
      
      // Fetch bookmarked profiles
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('bookmarked_user_id')
        .eq('user_id', user.id)

      if (bookmarksError) {
        console.error('Error fetching bookmarks:', bookmarksError)
        setBookmarkedProfiles([])
        return
      }

      if (!bookmarks || bookmarks.length === 0) {
        setBookmarkedProfiles([])
        return
      }

      // Fetch the full profiles of bookmarked users
      const bookmarkedUserIds = bookmarks.map(b => b.bookmarked_user_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', bookmarkedUserIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setBookmarkedProfiles([])
        return
      }

      // Map profiles to match the Profile type
      const mappedProfiles = (profiles || []).map(p => ({
        ...p,
        interests: Array.isArray(p.interests) ? p.interests : []
      }))
      setBookmarkedProfiles(mappedProfiles as Profile[])
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookmarkChange = () => {
    // Refresh bookmarks when a bookmark is removed
    fetchBookmarks()
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <TopBar onProfileClick={() => navigate('/account')} />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
          <h1 className="text-3xl font-bold">Bookmarked Profiles</h1>
          <p className="text-muted-foreground">Your saved profiles</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bookmarks...</p>
            </div>
          ) : bookmarkedProfiles.length > 0 ? (
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {bookmarkedProfiles.map((profile) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProfileCard
                        profile={profile}
                        onRate={() => {}}
                        currentUserId={currentUserId}
                        onBookmarkChange={handleBookmarkChange}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
              <BookmarkX className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No bookmarks yet</h2>
              <p className="text-muted-foreground mb-4">
                Start bookmarking profiles you're interested in
              </p>
              <Button onClick={() => navigate('/feed')} className="mt-6">
                Explore Profiles
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default Bookmarks
