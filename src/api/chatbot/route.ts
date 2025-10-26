/**
 * Cursor API Endpoint: /api/chatbot
 * Handles Gemini AI integration for the Campus Cupid chatbot
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration (adjusted for Gemini free tier)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 8 // 8 requests per minute per IP (Gemini free tier is 15/min)

/**
 * Check if request is within rate limit
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  userLimit.count++
  return true
}

/**
 * Call Gemini API with optimized settings for free tier
 */
async function callGeminiAPI(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.')
  }

  // Optimized prompt for dating advice
  const prompt = `You are Campus Cupid AI, a helpful dating assistant for college students. Provide friendly, supportive dating advice in 2-3 sentences. Be positive, encouraging, and practical. Keep it conversational and helpful.

User question: ${message}

Response:`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 150, // Limit response length for free tier
        temperature: 0.7, // Balanced creativity
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
    } else if (response.status === 400) {
      throw new Error('Invalid request. Please try rephrasing your question.')
    } else {
      throw new Error(`Gemini API error: ${response.status}`)
    }
  }

  const data = await response.json()
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Invalid Gemini response:', data)
    throw new Error('Invalid response from Gemini API')
  }

  const responseText = data.candidates[0].content.parts[0].text
  
  if (!responseText || responseText.trim().length === 0) {
    throw new Error('Empty response from Gemini API')
  }

  return responseText.trim()
}

/**
 * Fallback response when AI is unavailable
 */
function getFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()
  
  // Context-aware fallback responses
  if (message.includes('first date') || message.includes('date')) {
    return "I'm temporarily offline, but here's a quick tip: Choose an activity you both enjoy! Coffee shops, museums, or outdoor walks are perfect for conversation. 💕"
  }
  
  if (message.includes('conversation') || message.includes('talk')) {
    return "AI is taking a break, but remember: great conversations start with genuine interest! Ask about their hobbies, dreams, or favorite experiences. 🌟"
  }
  
  if (message.includes('profile') || message.includes('photo')) {
    return "I'm having a moment, but here's some advice: Use clear, recent photos that show your personality. Write a bio that's authentic and specific! ✨"
  }
  
  if (message.includes('nervous') || message.includes('anxiety')) {
    return "Temporarily offline, but keep this in mind: It's normal to feel nervous! Everyone does. Take deep breaths and focus on having fun rather than impressing them. 💪"
  }
  
  if (message.includes('match') || message.includes('compatibility')) {
    return "AI is resting, but here's wisdom: Look for shared values, interests, and communication styles. Don't just focus on physical attraction - emotional connection matters most! 💖"
  }
  
  // Default fallback
  return "I'm temporarily unavailable, but here's a universal dating tip: Be yourself, stay positive, and focus on genuine connections! The right person will appreciate you for who you are. 🌸"
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { message } = body

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Limit message length
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Call Gemini API
    try {
      const aiResponse = await callGeminiAPI(message.trim())
      
      return NextResponse.json({
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Gemini API error:', error)
      
      // Return fallback response
      return NextResponse.json({
        success: true,
        response: getFallbackResponse(message),
        fallback: true,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Chatbot API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
