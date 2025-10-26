import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Heart, 
  Lightbulb, 
  MessageCircle,
  X,
  Minimize2
} from 'lucide-react'
import { generateAIResponse, getRandomDatingTip, getConversationStarters, getProfileTips, ChatMessage, ChatbotResponse } from '@/services/chatbotService'

interface ChatbotProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onMinimize }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: "Hi! I'm your Campus Cupid dating assistant! 💕 I can help you with dating advice, conversation tips, profile optimization, and more. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(async () => {
      try {
        const aiResponse = await generateAIResponse(userMessage.content)
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.message,
          isUser: false,
          timestamp: new Date(),
          type: aiResponse.type === 'advice' ? 'advice' : aiResponse.type === 'tip' ? 'tip' : 'text'
        }

        setMessages(prev => [...prev, aiMessage])
      } catch (error) {
        console.error('Error getting AI response:', error)
        
        // Fallback message
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'm having trouble connecting right now. Please try again in a moment! 💕",
          isUser: false,
          timestamp: new Date(),
          type: 'text'
        }
        
        setMessages(prev => [...prev, fallbackMessage])
      } finally {
        setIsTyping(false)
      }
    }, 500) // Reduced delay since we're making real API calls
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const getQuickTips = () => {
    return [
      { text: "First date tips", icon: Heart },
      { text: "Conversation starters", icon: MessageCircle },
      { text: "Profile advice", icon: User },
      { text: "Random tip", icon: Lightbulb }
    ]
  }

  const handleQuickTip = (tipType: string) => {
    let message = ''
    
    switch (tipType) {
      case 'First date tips':
        message = 'What are some good first date ideas?'
        break
      case 'Conversation starters':
        message = 'Help me with conversation starters'
        break
      case 'Profile advice':
        message = 'How can I improve my profile?'
        break
      case 'Random tip':
        message = getRandomDatingTip()
        break
    }
    
    setInputValue(message)
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-4 right-4 w-96 h-[600px] z-50"
    >
      <Card className="h-full flex flex-col bg-card border-2 border-primary/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-lg">Campus Cupid AI</h3>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-2 rounded-full ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : message.type === 'advice' 
                        ? 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
                        : message.type === 'tip'
                          ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'advice' && (
                      <div className="mt-2 flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span className="text-xs font-medium">Dating Advice</span>
                      </div>
                    )}
                    {message.type === 'tip' && (
                      <div className="mt-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        <span className="text-xs font-medium">Pro Tip</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Tips */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex flex-wrap gap-2 mb-3">
            {getQuickTips().map((tip, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickTip(tip.text)}
                className="text-xs h-7"
              >
                <tip.icon className="h-3 w-3 mr-1" />
                {tip.text}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about dating..."
              className="flex-1 text-sm"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default Chatbot

