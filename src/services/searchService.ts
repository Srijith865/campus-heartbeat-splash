/**
 * Search Service for Campus Cupid
 * Handles profile search with exact and fuzzy matching
 */

import { Profile } from './aiService'

export interface SearchResult {
  profile: Profile
  matchType: 'exact' | 'partial' | 'fuzzy'
  score: number
}

/**
 * Search profiles by username, interests, or bio
 */
export function searchProfiles(query: string, profiles: Profile[]): SearchResult[] {
  if (!query.trim()) return []

  const normalizedQuery = query.toLowerCase().trim()
  const results: SearchResult[] = []

  profiles.forEach(profile => {
    let score = 0
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy'

    // Exact username match (highest priority)
    if (profile.username?.toLowerCase() === normalizedQuery) {
      score = 100
      matchType = 'exact'
    }
    // Partial username match
    else if (profile.username?.toLowerCase().includes(normalizedQuery)) {
      score = 80
      matchType = 'partial'
    }
    // Username starts with query
    else if (profile.username?.toLowerCase().startsWith(normalizedQuery)) {
      score = 70
      matchType = 'partial'
    }
    // Bio search
    else if (profile.bio?.toLowerCase().includes(normalizedQuery)) {
      score = 60
      matchType = 'partial'
    }
    // Interest search
    else if (profile.interests?.some(interest => 
      interest.toLowerCase().includes(normalizedQuery)
    )) {
      score = 50
      matchType = 'partial'
    }
    // Fuzzy matching for partial word matches
    else {
      const fuzzyScore = calculateFuzzyScore(normalizedQuery, profile)
      if (fuzzyScore > 30) {
        score = fuzzyScore
        matchType = 'fuzzy'
      }
    }

    if (score > 0) {
      results.push({
        profile,
        matchType,
        score
      })
    }
  })

  // Sort by score (exact matches first, then by score)
  return results.sort((a, b) => {
    if (a.matchType === 'exact' && b.matchType !== 'exact') return -1
    if (b.matchType === 'exact' && a.matchType !== 'exact') return 1
    return b.score - a.score
  })
}

/**
 * Calculate fuzzy matching score
 */
function calculateFuzzyScore(query: string, profile: Profile): number {
  let maxScore = 0

  // Check username fuzzy match
  if (profile.username) {
    const usernameScore = fuzzyMatch(query, profile.username.toLowerCase())
    maxScore = Math.max(maxScore, usernameScore * 0.8)
  }

  // Check bio fuzzy match
  if (profile.bio) {
    const bioScore = fuzzyMatch(query, profile.bio.toLowerCase())
    maxScore = Math.max(maxScore, bioScore * 0.6)
  }

  // Check interests fuzzy match
  if (profile.interests) {
    const interestScores = profile.interests.map(interest => 
      fuzzyMatch(query, interest.toLowerCase())
    )
    const maxInterestScore = Math.max(...interestScores)
    maxScore = Math.max(maxScore, maxInterestScore * 0.7)
  }

  return Math.round(maxScore)
}

/**
 * Simple fuzzy string matching algorithm
 */
function fuzzyMatch(query: string, text: string): number {
  if (!query || !text) return 0

  const queryWords = query.split(/\s+/)
  const textWords = text.split(/\s+/)
  
  let totalScore = 0
  let matchedWords = 0

  queryWords.forEach(queryWord => {
    let bestScore = 0
    
    textWords.forEach(textWord => {
      const score = calculateWordSimilarity(queryWord, textWord)
      bestScore = Math.max(bestScore, score)
    })
    
    if (bestScore > 0.5) {
      totalScore += bestScore
      matchedWords++
    }
  })

  return matchedWords > 0 ? (totalScore / queryWords.length) * 100 : 0
}

/**
 * Calculate similarity between two words
 */
function calculateWordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1
  
  // Check if one word contains the other
  if (word1.includes(word2) || word2.includes(word1)) {
    return 0.8
  }
  
  // Simple Levenshtein distance-based similarity
  const distance = levenshteinDistance(word1, word2)
  const maxLength = Math.max(word1.length, word2.length)
  
  if (maxLength === 0) return 0
  
  return 1 - (distance / maxLength)
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  )

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(query: string, profiles: Profile[]): string[] {
  if (!query.trim()) return []

  const suggestions: string[] = []
  const normalizedQuery = query.toLowerCase()

  profiles.forEach(profile => {
    // Username suggestions
    if (profile.username?.toLowerCase().includes(normalizedQuery)) {
      suggestions.push(profile.username)
    }

    // Interest suggestions
    profile.interests?.forEach(interest => {
      if (interest.toLowerCase().includes(normalizedQuery)) {
        suggestions.push(interest)
      }
    })
  })

  // Remove duplicates and limit results
  return [...new Set(suggestions)].slice(0, 5)
}

