import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MessageCircle, Bot } from 'lucide-react'
import Chatbot from './Chatbot'

const ChatbotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false)
      setIsOpen(true)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsOpen(false)
    setIsMinimized(true)
  }

  return (
    <>
      {/* Chatbot Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
      >
        <Button
          onClick={handleToggle}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:scale-110"
        >
          <motion.div
            animate={{ 
              rotate: isOpen ? 180 : 0,
              scale: isOpen ? 0.8 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? (
              <Bot className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </motion.div>
        </Button>
        
        {/* Notification badge */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white font-bold">AI</span>
          </motion.div>
        )}
      </motion.div>

      {/* Chatbot Component */}
      <Chatbot
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />
    </>
  )
}

export default ChatbotButton

