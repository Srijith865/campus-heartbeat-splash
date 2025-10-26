/**
 * Chatbot Service for Campus Cupid
 * Handles AI-powered dating advice and user interactions
 */

export interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  type: 'text' | 'advice' | 'tip'
}

export interface ChatbotResponse {
  message: string
  type: 'advice' | 'tip' | 'general'
  suggestions?: string[]
}

/**
 * Call the Cursor API to get AI response from Gemini
 */
export async function generateAIResponse(userMessage: string): Promise<ChatbotResponse> {
  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      return {
        message: data.response,
        type: data.fallback ? 'general' : 'advice',
        suggestions: data.fallback ? ['Try again later', 'Ask a different question'] : undefined
      }
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (error: any) {
    console.error('Error calling chatbot API:', error)
    
    // Check if it's a rate limit error
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return {
        message: "I'm getting too many requests right now! Please wait a moment and try again. 💕",
        type: 'general',
        suggestions: ['Wait 1 minute', 'Try a different question']
      }
    }
    
    // Check if it's an API key error
    if (error.message.includes('API key') || error.message.includes('configured')) {
      return {
        message: "I'm not properly configured yet. Please contact support to set up the AI features! 🤖",
        type: 'general',
        suggestions: ['Contact support', 'Try again later']
      }
    }
    
    // Fallback to local responses if API is unavailable
    return getLocalAIResponse(userMessage)
  }
}

/**
 * Local fallback AI response for dating advice
 * Used when the API is unavailable
 */
export function getLocalAIResponse(userMessage: string): ChatbotResponse {
  const message = userMessage.toLowerCase()
  
  // Dating advice responses
  if (message.includes('first date') || message.includes('first meeting')) {
    return {
      message: "For a great first date, choose an activity you both enjoy! Coffee shops, museums, or outdoor walks are perfect for conversation. Be yourself, ask questions, and listen actively. Remember, it's about getting to know each other! 💕",
      type: 'advice',
      suggestions: ['What should I wear?', 'How to break the ice?', 'Date conversation topics']
    }
  }
  
  if (message.includes('conversation') || message.includes('talk') || message.includes('chat')) {
    return {
      message: "Great conversations start with genuine interest! Ask about their hobbies, dreams, or favorite experiences. Share your own stories too. Avoid controversial topics early on. Remember, the best conversations flow naturally! 🌟",
      type: 'advice',
      suggestions: ['Fun conversation starters', 'Topics to avoid', 'How to keep it flowing']
    }
  }
  
  if (message.includes('profile') || message.includes('bio') || message.includes('photo')) {
    return {
      message: "Your profile is your first impression! Use clear, recent photos that show your personality. Write a bio that's authentic and specific - mention hobbies, interests, or what you're looking for. Be positive and genuine! ✨",
      type: 'advice',
      suggestions: ['Photo tips', 'Bio writing help', 'Profile optimization']
    }
  }
  
  if (message.includes('match') || message.includes('compatibility')) {
    return {
      message: "Compatibility is about shared values, interests, and communication styles. Look for someone who makes you laugh, supports your goals, and shares similar life priorities. Don't just focus on physical attraction - emotional connection matters most! 💖",
      type: 'advice',
      suggestions: ['Signs of compatibility', 'Red flags to watch for', 'Building connection']
    }
  }
  
  if (message.includes('nervous') || message.includes('anxiety') || message.includes('scared')) {
    return {
      message: "It's completely normal to feel nervous! Everyone feels this way when meeting someone new. Take deep breaths, remind yourself that they're probably nervous too, and focus on having fun rather than impressing them. You've got this! 🌸",
      type: 'advice',
      suggestions: ['Calming techniques', 'Building confidence', 'Overcoming anxiety']
    }
  }
  
  if (message.includes('rejection') || message.includes('ghost') || message.includes('ignore')) {
    return {
      message: "Rejection is part of dating, but it doesn't define your worth! If someone ghosts you or isn't interested, it's their loss. Focus on people who appreciate you. Remember, the right person will be excited to know you! 💪",
      type: 'advice',
      suggestions: ['Moving on tips', 'Building resilience', 'Staying positive']
    }
  }
  
  if (message.includes('long distance') || message.includes('distance')) {
    return {
      message: "Long distance relationships can work with effort and communication! Set regular times to talk, share daily experiences, and plan visits. Trust and patience are key. Many successful relationships start long distance! 🌍",
      type: 'advice',
      suggestions: ['Communication tips', 'Making it work', 'Planning visits']
    }
  }
  
  if (message.includes('breakup') || message.includes('break up') || message.includes('end')) {
    return {
      message: "Breakups are tough, but they're also opportunities for growth. Take time to heal, focus on yourself, and learn from the experience. Surround yourself with supportive friends and remember that better things are ahead! 🌅",
      type: 'advice',
      suggestions: ['Healing process', 'Moving forward', 'Self-care tips']
    }
  }
  
  // General tips
  if (message.includes('tip') || message.includes('help') || message.includes('advice')) {
    return {
      message: "Here's a great dating tip: Be authentic! Don't try to be someone you're not. The right person will love you for who you truly are. Also, don't rush things - let relationships develop naturally. Quality over quantity! 🌟",
      type: 'tip',
      suggestions: ['More tips', 'Common mistakes', 'Success stories']
    }
  }
  
  // Default response
  return {
    message: "I'm here to help with your dating journey! I can give advice on first dates, conversations, profiles, compatibility, and more. What would you like to know about? 💕",
    type: 'general',
    suggestions: ['First date tips', 'Conversation help', 'Profile advice', 'Compatibility guide']
  }
}

/**
 * Get random dating tip
 */
export function getRandomDatingTip(): string {
  const tips = [
    "Be yourself - authenticity is attractive! 💫",
    "Listen more than you talk - people love feeling heard! 👂",
    "Ask open-ended questions to keep conversations flowing! 💬",
    "Share your passions - enthusiasm is contagious! 🔥",
    "Be positive - optimism attracts good energy! ✨",
    "Take initiative - confidence is sexy! 💪",
    "Be patient - good things take time! ⏰",
    "Stay curious - every person has a story! 📖",
    "Be kind - kindness never goes out of style! 💖",
    "Have fun - dating should be enjoyable! 🎉"
  ]
  
  return tips[Math.floor(Math.random() * tips.length)]
}

/**
 * Get conversation starters
 */
export function getConversationStarters(): string[] {
  return [
    "What's the most exciting thing you've done recently?",
    "If you could travel anywhere, where would you go?",
    "What's your favorite way to spend a weekend?",
    "What's something you're passionate about?",
    "What's the best book/movie/show you've discovered lately?",
    "What's your dream job or career goal?",
    "What's something that always makes you smile?",
    "What's a skill you'd love to learn?",
    "What's your favorite type of cuisine?",
    "What's something you're grateful for today?"
  ]
}

/**
 * Get profile optimization tips
 */
export function getProfileTips(): string[] {
  return [
    "Use recent, clear photos that show your face",
    "Include photos that show your hobbies and interests",
    "Write a bio that's specific and authentic",
    "Mention what you're looking for in a relationship",
    "Be positive and avoid negativity",
    "Update your profile regularly",
    "Use good lighting in your photos",
    "Include photos with friends to show you're social",
    "Be honest about your age and interests",
    "Proofread your bio for spelling errors"
  ]
}

