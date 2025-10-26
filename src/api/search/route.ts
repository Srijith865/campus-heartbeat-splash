/**
 * Cursor API Endpoint: /api/search
 * Handles profile search with exact and partial matching
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Query too long (max 100 characters)' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim().toLowerCase()

    // Search for profiles with exact and partial matches
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, main_photo_url, bio, age, gender, interests')
      .eq('is_active', true)
      .eq('is_visible', true)
      .limit(50) // Get more results to filter client-side

    if (error) {
      console.error('Supabase search error:', error)
      return NextResponse.json(
        { error: 'Database search failed' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0
      })
    }

    // Filter and rank results
    const results = profiles
      .map(profile => {
        const username = profile.username?.toLowerCase() || ''
        const bio = profile.bio?.toLowerCase() || ''
        const interests = Array.isArray(profile.interests) 
          ? profile.interests.map((interest: any) => 
              typeof interest === 'string' ? interest.toLowerCase() : interest.text?.toLowerCase() || ''
            )
          : []

        let score = 0
        let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy'

        // Exact username match (highest priority)
        if (username === searchTerm) {
          score = 100
          matchType = 'exact'
        }
        // Username starts with search term
        else if (username.startsWith(searchTerm)) {
          score = 80
          matchType = 'partial'
        }
        // Username contains search term
        else if (username.includes(searchTerm)) {
          score = 70
          matchType = 'partial'
        }
        // Bio contains search term
        else if (bio.includes(searchTerm)) {
          score = 60
          matchType = 'partial'
        }
        // Interest matches
        else if (interests.some(interest => interest.includes(searchTerm))) {
          score = 50
          matchType = 'partial'
        }
        // Fuzzy matching for partial word matches
        else {
          const words = searchTerm.split(' ')
          let fuzzyScore = 0
          
          words.forEach(word => {
            if (username.includes(word)) fuzzyScore += 30
            if (bio.includes(word)) fuzzyScore += 20
            if (interests.some(interest => interest.includes(word))) fuzzyScore += 25
          })
          
          if (fuzzyScore > 0) {
            score = fuzzyScore
            matchType = 'fuzzy'
          }
        }

        return {
          id: profile.id,
          username: profile.username,
          main_photo_url: profile.main_photo_url,
          bio: profile.bio,
          age: profile.age,
          gender: profile.gender,
          interests: interests,
          score,
          matchType
        }
      })
      .filter(result => result.score > 0)
      .sort((a, b) => {
        // Sort by match type first, then by score
        if (a.matchType === 'exact' && b.matchType !== 'exact') return -1
        if (b.matchType === 'exact' && a.matchType !== 'exact') return 1
        return b.score - a.score
      })
      .slice(0, 10) // Limit to top 10 results

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      query: searchTerm
    })

  } catch (error) {
    console.error('Search API error:', error)
    
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

