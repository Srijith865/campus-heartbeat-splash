/**
 * AI Service for Campus Cupid
 * Handles AI-powered features like similarity scoring, feed suggestions, and compatibility analysis
 */

export interface Profile {
  id: string
  username: string
  main_photo_url?: string
  interests?: string[]
  bio?: string
  age?: number
  gender?: string
  personality?: string
}

export interface SimilarityScore {
  profile: Profile
  score: number
  reasons: string[]
}

/**
 * Calculate similarity score between two profiles based on interests, bio, and personality
 */
export function calculateSimilarityScore(profile1: Profile, profile2: Profile): number {
  let score = 0
  let factors = 0

  // Interest similarity (40% weight)
  if (profile1.interests && profile2.interests) {
    const commonInterests = profile1.interests.filter(interest => 
      profile2.interests!.includes(interest)
    ).length
    const totalInterests = new Set([...profile1.interests, ...profile2.interests]).size
    
    if (totalInterests > 0) {
      const interestScore = (commonInterests / totalInterests) * 40
      score += interestScore
      factors++
    }
  }

  // Bio similarity using simple keyword matching (30% weight)
  if (profile1.bio && profile2.bio) {
    const bio1Words = profile1.bio.toLowerCase().split(/\s+/)
    const bio2Words = profile2.bio.toLowerCase().split(/\s+/)
    
    const commonWords = bio1Words.filter(word => 
      word.length > 3 && bio2Words.includes(word)
    ).length
    
    const totalWords = new Set([...bio1Words, ...bio2Words]).size
    
    if (totalWords > 0) {
      const bioScore = (commonWords / totalWords) * 30
      score += bioScore
      factors++
    }
  }

  // Personality compatibility (20% weight)
  if (profile1.personality && profile2.personality) {
    const personalityCompatibility = getPersonalityCompatibility(
      profile1.personality, 
      profile2.personality
    )
    score += personalityCompatibility * 20
    factors++
  }

  // Age compatibility (10% weight)
  if (profile1.age && profile2.age) {
    const ageDiff = Math.abs(profile1.age - profile2.age)
    const ageScore = Math.max(0, (10 - ageDiff) / 10) * 10
    score += ageScore
    factors++
  }

  // Normalize score based on available factors
  return factors > 0 ? Math.min(100, Math.round(score / factors * 100)) : 0
}

/**
 * Get personality compatibility score
 */
function getPersonalityCompatibility(personality1: string, personality2: string): number {
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    introvert: {
      introvert: 0.9,
      extrovert: 0.6,
      ambivert: 0.8
    },
    extrovert: {
      introvert: 0.6,
      extrovert: 0.9,
      ambivert: 0.8
    },
    ambivert: {
      introvert: 0.8,
      extrovert: 0.8,
      ambivert: 0.9
    }
  }

  return compatibilityMatrix[personality1]?.[personality2] || 0.5
}

/**
 * Generate reasons for compatibility score
 */
export function generateCompatibilityReasons(profile1: Profile, profile2: Profile): string[] {
  const reasons: string[] = []

  // Interest-based reasons
  if (profile1.interests && profile2.interests) {
    const commonInterests = profile1.interests.filter(interest => 
      profile2.interests!.includes(interest)
    )
    
    if (commonInterests.length > 0) {
      reasons.push(`You both love ${commonInterests.slice(0, 2).join(' and ')}`)
    }
  }

  // Bio-based reasons
  if (profile1.bio && profile2.bio) {
    const bio1Words = profile1.bio.toLowerCase().split(/\s+/)
    const bio2Words = profile2.bio.toLowerCase().split(/\s+/)
    
    const commonWords = bio1Words.filter(word => 
      word.length > 3 && bio2Words.includes(word)
    )
    
    if (commonWords.length > 0) {
      reasons.push(`Similar interests mentioned in bio`)
    }
  }

  // Personality-based reasons
  if (profile1.personality && profile2.personality) {
    if (profile1.personality === profile2.personality) {
      reasons.push(`Both ${profile1.personality}s - great compatibility!`)
    } else if (profile1.personality === 'ambivert' || profile2.personality === 'ambivert') {
      reasons.push(`Complementary personality types`)
    }
  }

  // Age-based reasons
  if (profile1.age && profile2.age) {
    const ageDiff = Math.abs(profile1.age - profile2.age)
    if (ageDiff <= 2) {
      reasons.push(`Similar age range`)
    }
  }

  return reasons.length > 0 ? reasons : ['Potential match based on profile analysis']
}

/**
 * Rank profiles by similarity score
 */
export function rankProfilesBySimilarity(currentProfile: Profile, profiles: Profile[]): SimilarityScore[] {
  return profiles
    .map(profile => ({
      profile,
      score: calculateSimilarityScore(currentProfile, profile),
      reasons: generateCompatibilityReasons(currentProfile, profile)
    }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Get AI-powered feed suggestions
 */
export function getAIFeedSuggestions(currentProfile: Profile, allProfiles: Profile[]): Profile[] {
  // Filter out current user and opposite gender only
  const oppositeGender = currentProfile.gender === 'male' ? 'female' : 'male'
  const candidateProfiles = allProfiles.filter(profile => 
    profile.id !== currentProfile.id && 
    profile.gender === oppositeGender
  )

  // Rank by similarity
  const rankedProfiles = rankProfilesBySimilarity(currentProfile, candidateProfiles)
  
  // Return top profiles with good similarity scores
  return rankedProfiles
    .filter(item => item.score >= 30) // Minimum 30% compatibility
    .slice(0, 20) // Top 20 suggestions
    .map(item => item.profile)
}

/**
 * Get compatibility score for display
 */
export function getCompatibilityScore(profile1: Profile, profile2: Profile): number {
  return calculateSimilarityScore(profile1, profile2)
}

