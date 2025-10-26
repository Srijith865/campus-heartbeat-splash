/**
 * Cursor Backend API Service
 * 
 * This service provides integration with the Cursor-hosted backend
 * for smart recommendations, notifications, and analytics.
 * 
 * Configure the base URL via environment variable:
 * VITE_CURSOR_API_URL=https://your-cursor-backend.com/api
 */

// Types for API responses
export interface RecommendedProfile {
  id: string
  username: string
  main_photo_url?: string
  interests?: string[]
  bio?: string
  compatibility_score?: number
}

export interface MatchSummary {
  total_matches: number
  recent_matches: number
  avg_compatibility: number
  active_chats: number
}

export interface NotificationResponse {
  success: boolean
  notification_id?: string
  message?: string
}

// Configuration
const CURSOR_API_URL = import.meta.env.VITE_CURSOR_API_URL || 'http://localhost:3000/api'
const REQUEST_TIMEOUT = 5000 // 5 seconds

/**
 * Base fetch wrapper with timeout and error handling
 */
async function cursorFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${CURSOR_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`Cursor API error: ${response.status} ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Cursor API request timed out')
      } else {
        console.warn('Cursor API request failed:', error.message)
      }
    }
    
    return null
  }
}

/**
 * Get personalized feed recommendations for a user
 * @param userId - The ID of the user requesting recommendations
 * @returns Array of recommended profiles or null if request fails
 */
export async function getRecommendedFeed(
  userId: string
): Promise<RecommendedProfile[] | null> {
  return cursorFetch<RecommendedProfile[]>(`/recommendations/${userId}`)
}

/**
 * Get match summary statistics for a user
 * @param userId - The ID of the user
 * @returns Match summary data or null if request fails
 */
export async function getMatchSummary(
  userId: string
): Promise<MatchSummary | null> {
  return cursorFetch<MatchSummary>(`/analytics/match-summary/${userId}`)
}

/**
 * Send a notification for a new match
 * @param matchId - The ID of the match
 * @returns Notification response or null if request fails
 */
export async function sendNotification(
  matchId: string
): Promise<NotificationResponse | null> {
  return cursorFetch<NotificationResponse>('/notifications/match', {
    method: 'POST',
    body: JSON.stringify({ matchId }),
  })
}

/**
 * Check if Cursor API is available
 * @returns true if API is reachable, false otherwise
 */
export async function checkCursorApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${CURSOR_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

// Export the base URL for reference
export { CURSOR_API_URL }
