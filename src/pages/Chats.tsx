import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import TopBar from '@/components/TopBar'

interface MatchWithProfile {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  chat_id?: string
  other_user: {
    id: string
    username: string
    main_photo_url?: string
  }
  last_message?: {
    content: string
    created_at: string
  }
}

const Chats = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>()

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Fetch current user's avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('main_photo_url')
        .eq('id', user.id)
        .single()
      
      if (profile?.main_photo_url) {
        setCurrentUserAvatar(profile.main_photo_url)
      }

      // Fetch all matches for current user
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (matchesError) throw matchesError

      if (!matchesData || matchesData.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }

      // Get other user IDs
      const otherUserIds = matchesData.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      )

      // Fetch other users' profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, main_photo_url')
        .in('id', otherUserIds)

      if (profilesError) throw profilesError

      // Fetch chats for these matches
      const { data: chatsData } = await supabase
        .from('chats')
        .select('id, match_id')
        .in('match_id', matchesData.map(m => m.id))

      // Create a map of match_id to chat_id
      const chatMap = new Map(chatsData?.map(c => [c.match_id, c.id]) || [])

      // Fetch last messages for each chat
      const chatIds = chatsData?.map(c => c.id) || []
      let lastMessages = new Map()
      
      if (chatIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('messages')
          .select('chat_id, content, created_at')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })

        // Group by chat_id and get the most recent
        messagesData?.forEach(msg => {
          if (!lastMessages.has(msg.chat_id)) {
            lastMessages.set(msg.chat_id, msg)
          }
        })
      }

      // Combine data
      const enrichedMatches: MatchWithProfile[] = matchesData.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id
        const otherUser = profiles?.find(p => p.id === otherUserId)
        const chatId = chatMap.get(match.id)
        const lastMsg = chatId ? lastMessages.get(chatId) : undefined

        return {
          ...match,
          chat_id: chatId,
          other_user: otherUser || { id: otherUserId, username: 'Unknown' },
          last_message: lastMsg
        }
      })

      setMatches(enrichedMatches)
    } catch (error: any) {
      console.error('Error fetching matches:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your matches',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = async (match: MatchWithProfile) => {
    try {
      let chatId = match.chat_id

      // chat feature start
      // If no chat exists yet, create one
      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ match_id: match.id })
          .select()
          .single()

        if (chatError) throw chatError
        chatId = newChat.id
      }
      // chat feature end

      navigate(`/chat/${chatId}`)
    } catch (error: any) {
      console.error('Error opening chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to open chat',
        variant: 'destructive'
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <TopBar 
        avatarUrl={currentUserAvatar}
        onProfileClick={() => navigate('/account')}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/feed')}
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Your Matches</h1>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No matches state */}
        {!loading && matches.length === 0 && (
          <Card className="bg-gradient-card">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Matches Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start rating profiles to find your matches!
              </p>
              <Button onClick={() => navigate('/feed')}>
                Browse Profiles
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Matches list */}
        {!loading && matches.length > 0 && (
          <div className="space-y-3">
            {matches.map(match => (
              <Card 
                key={match.id}
                className="bg-gradient-card hover:shadow-card transition-all cursor-pointer"
                onClick={() => handleChatClick(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage 
                        src={match.other_user.main_photo_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'}
                        alt={match.other_user.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {match.other_user.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {match.other_user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {match.last_message 
                          ? match.last_message.content
                          : 'Start a conversation'}
                      </p>
                    </div>

                    {/* Time and indicator */}
                    <div className="flex flex-col items-end gap-1">
                      {match.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(match.last_message.created_at)}
                        </span>
                      )}
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Chats