/**
 * Bookmark Service for Campus Cupid
 * Handles bookmarking profiles and managing bookmarked users
 */

import { supabase } from '@/integrations/supabase/client'
import { Profile } from './aiService'

export interface Bookmark {
  id: string
  user_id: string
  bookmarked_user_id: string
  created_at: string
}

/**
 * Add a profile to bookmarks
 */
export async function addBookmark(userId: string, profileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        bookmarked_user_id: profileId
      })

    if (error) {
      // If table doesn't exist, show helpful error
      if (error.message.includes('relation "bookmarks" does not exist')) {
        console.error('Bookmarks table does not exist. Please run the migration SQL in your Supabase dashboard.')
        throw new Error('Bookmarks feature is not set up yet. Please contact support.')
      }
      throw error
    }
    return true
  } catch (error) {
    console.error('Error adding bookmark:', error)
    return false
  }
}

/**
 * Remove a profile from bookmarks
 */
export async function removeBookmark(userId: string, profileId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('bookmarked_user_id', profileId)

    if (error) {
      if (error.message.includes('relation "bookmarks" does not exist')) {
        console.error('Bookmarks table does not exist. Please run the migration SQL in your Supabase dashboard.')
        throw new Error('Bookmarks feature is not set up yet. Please contact support.')
      }
      throw error
    }
    return true
  } catch (error) {
    console.error('Error removing bookmark:', error)
    return false
  }
}

/**
 * Check if a profile is bookmarked
 */
export async function isBookmarked(userId: string, profileId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('bookmarked_user_id', profileId)
      .single()

    if (error && error.code !== 'PGRST116') {
      if (error.message.includes('relation "bookmarks" does not exist')) {
        console.error('Bookmarks table does not exist. Please run the migration SQL in your Supabase dashboard.')
        return false
      }
      throw error
    }
    return !!data
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return false
  }
}

/**
 * Get all bookmarked profiles for a user
 */
export async function getBookmarkedProfiles(userId: string): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        bookmarked_user_id,
        profiles:bookmarked_user_id (
          id,
          username,
          main_photo_url,
          interests,
          bio,
          age,
          gender,
          personality
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message.includes('relation "bookmarks" does not exist')) {
        console.error('Bookmarks table does not exist. Please run the migration SQL in your Supabase dashboard.')
        return []
      }
      throw error
    }

    // Transform the data to match Profile interface
    const profiles = (data || []).map((item: any) => {
      const profile = item.profiles
      return {
        id: profile.id,
        username: profile.username,
        main_photo_url: profile.main_photo_url,
        interests: Array.isArray(profile.interests) 
          ? profile.interests.map((interest: any) => 
              typeof interest === 'string' ? interest : interest.text
            )
          : [],
        bio: profile.bio,
        age: profile.age,
        gender: profile.gender,
        personality: profile.personality
      }
    })

    return profiles
  } catch (error) {
    console.error('Error fetching bookmarked profiles:', error)
    return []
  }
}

/**
 * Toggle bookmark status for a profile
 */
export async function toggleBookmark(userId: string, profileId: string): Promise<boolean> {
  const isCurrentlyBookmarked = await isBookmarked(userId, profileId)
  
  if (isCurrentlyBookmarked) {
    return await removeBookmark(userId, profileId)
  } else {
    return await addBookmark(userId, profileId)
  }
}
