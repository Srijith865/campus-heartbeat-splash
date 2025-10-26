import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { supabase } from '@/integrations/supabase/client'

interface TopBarProps {
  avatarUrl?: string
  onProfileClick: () => void
  showChatButton?: boolean
}

const TopBar: React.FC<TopBarProps> = ({ avatarUrl, onProfileClick, showChatButton = true }) => {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [userId, setUserId] = useState<string | null>(null)
  const fallbackImage = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [])

  const toggleDarkMode = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    
    if (userId) {
      await supabase
        .from('profiles')
        .update({ dark_mode: newTheme === 'dark' })
        .eq('id', userId)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        {/* App logo/name */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-full">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Campus Cupid
          </h1>
        </div>

        {/* chat feature start - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {showChatButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chats')}
              aria-label="View chats"
              className="relative"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          )}

          {/* Profile avatar button */}
          <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-1 h-auto w-auto"
          onClick={onProfileClick}
          aria-label="View profile"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <AvatarImage 
              src={avatarUrl || fallbackImage} 
              alt="Your profile"
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-primary text-white">
              You
            </AvatarFallback>
          </Avatar>
        </Button>
        </div>
        {/* chat feature end */}
      </div>
    </header>
  )
}

export default TopBar

/*
Usage example:

<TopBar
  avatarUrl="https://example.com/your-avatar.jpg"
  onProfileClick={() => navigate('/profile')}
/>
*/
