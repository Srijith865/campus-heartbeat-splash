import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Send, Smile, Palette, Check, CheckCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
  delivered_at?: string
  reactions?: MessageReaction[]
}

interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

interface OtherUser {
  id: string
  username: string
  main_photo_url?: string
}

const CHAT_THEMES = {
  default: 'bg-gradient-background',
  ocean: 'bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950',
  sunset: 'bg-gradient-to-b from-orange-50 to-pink-50 dark:from-orange-950 dark:to-pink-950',
  forest: 'bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
  lavender: 'bg-gradient-to-b from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950'
}

const EMOJI_OPTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👏']

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [otherUser, setOtherUser] = useState<OtherUser>()
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [chatTheme, setChatTheme] = useState<keyof typeof CHAT_THEMES>('default')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!chatId) {
      navigate('/chats')
      return
    }
    
    initializeChat()
    const cleanup = setupRealtimeSubscription()
    
    // Load saved theme
    const savedTheme = localStorage.getItem(`chat-theme-${chatId}`) as keyof typeof CHAT_THEMES
    if (savedTheme && CHAT_THEMES[savedTheme]) {
      setChatTheme(savedTheme)
    }

    return cleanup
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
    markMessagesAsRead()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const markMessagesAsRead = async () => {
    if (!currentUserId || !chatId) return
    
    const unreadMessages = messages.filter(
      m => m.sender_id !== currentUserId && !m.read_at
    )

    if (unreadMessages.length === 0) return

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessages.map(m => m.id))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const initializeChat = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUserId(user.id)

      // Fetch chat to get match_id
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('match_id')
        .eq('id', chatId)
        .single()

      if (chatError) throw chatError

      // Fetch match to get other user
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', chat.match_id)
        .single()

      if (matchError) throw matchError

      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id

      // Fetch other user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, main_photo_url')
        .eq('id', otherUserId)
        .single()

      if (profileError) throw profileError
      setOtherUser(profile)

      // Fetch messages with reactions
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          reactions:message_reactions(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (error: any) {
      console.error('Error initializing chat:', error)
      toast({
        title: 'Error',
        description: 'Failed to load chat',
        variant: 'destructive'
      })
      navigate('/chats')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      // Listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, { ...newMsg, reactions: [] }])
        }
      )
      // Listen for message updates (read receipts)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message
          setMessages(prev => prev.map(m => 
            m.id === updatedMsg.id ? { ...m, read_at: updatedMsg.read_at } : m
          ))
        }
      )
      // Listen for reactions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const newReaction = payload.new as MessageReaction
          setMessages(prev => prev.map(m => 
            m.id === newReaction.message_id 
              ? { ...m, reactions: [...(m.reactions || []), newReaction] }
              : m
          ))
        }
      )
      // Listen for reaction deletions
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload) => {
          const deletedReaction = payload.old as MessageReaction
          setMessages(prev => prev.map(m => 
            m.id === deletedReaction.message_id
              ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== deletedReaction.id) }
              : m
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      // In a real app, you'd broadcast typing status via Supabase Realtime presence
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !currentUserId || !chatId) return

    try {
      setSending(true)
      setIsTyping(false)
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      inputRef.current?.focus()
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return

    try {
      const message = messages.find(m => m.id === messageId)
      const existingReaction = message?.reactions?.find(
        r => r.user_id === currentUserId && r.emoji === emoji
      )

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji
          })
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const handleThemeChange = (theme: keyof typeof CHAT_THEMES) => {
    setChatTheme(theme)
    localStorage.setItem(`chat-theme-${chatId}`, theme)
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const groupReactions = (reactions: MessageReaction[] = []) => {
    const grouped: Record<string, { count: number; userIds: string[] }> = {}
    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, userIds: [] }
      }
      grouped[r.emoji].count++
      grouped[r.emoji].userIds.push(r.user_id)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${CHAT_THEMES[chatTheme]} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${CHAT_THEMES[chatTheme]} flex flex-col`}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/chats')}
            aria-label="Back to matches"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {otherUser && (
            <>
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage 
                  src={otherUser.main_photo_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'}
                  alt={otherUser.username}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {otherUser.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">{otherUser.username}</h1>
                {otherUserTyping && (
                  <p className="text-xs text-muted-foreground">typing...</p>
                )}
              </div>
            </>
          )}

          {/* Theme Selector */}
          <Select value={chatTheme} onValueChange={(v) => handleThemeChange(v as keyof typeof CHAT_THEMES)}>
            <SelectTrigger className="w-[140px]">
              <Palette className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="ocean">Ocean</SelectItem>
              <SelectItem value="sunset">Sunset</SelectItem>
              <SelectItem value="forest">Forest</SelectItem>
              <SelectItem value="lavender">Lavender</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Messages container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId
              const groupedReactions = groupReactions(message.reactions)
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[75%]">
                    <div
                      className={`${
                        isOwnMessage
                          ? 'bg-gradient-primary text-primary-foreground'
                          : 'bg-card text-card-foreground'
                      } rounded-2xl px-4 py-2 shadow-soft`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className={`text-xs ${
                            isOwnMessage 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs">
                            {message.read_at ? (
                              <CheckCheck className="h-3 w-3 text-blue-400" />
                            ) : message.delivered_at ? (
                              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-foreground/50" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center gap-1 mt-1">
                      {Object.entries(groupedReactions).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            data.userIds.includes(currentUserId!)
                              ? 'bg-primary/20 border border-primary'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-xs">{data.count}</span>
                        </button>
                      ))}
                      
                      {/* Add Reaction Button */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded-full transition-colors">
                            <Smile className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {EMOJI_OPTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="text-xl hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Message input */}
      <footer className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 px-4 py-3 max-w-2xl mx-auto"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            disabled={sending}
            className="flex-1 bg-input border-border focus:border-input-focus"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  )
}

export default Chat