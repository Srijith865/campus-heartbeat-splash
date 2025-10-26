/**
 * Cursor API Endpoint: /api/delete-account
 * Handles secure account deletion with proper cleanup
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

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Start a transaction-like process
    try {
      // 1. Delete user's ratings
      const { error: ratingsError } = await supabase
        .from('ratings')
        .delete()
        .or(`rater_id.eq.${userId},rated_id.eq.${userId}`)

      if (ratingsError) {
        console.error('Error deleting ratings:', ratingsError)
        // Continue with other deletions even if this fails
      }

      // 2. Delete user's messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('sender_id', userId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        // Continue with other deletions even if this fails
      }

      // 3. Delete user's chats
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (chatsError) {
        console.error('Error deleting chats:', chatsError)
        // Continue with other deletions even if this fails
      }

      // 4. Delete user's matches
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (matchesError) {
        console.error('Error deleting matches:', matchesError)
        // Continue with other deletions even if this fails
      }

      // 5. Delete user's bookmarks
      const { error: bookmarksError } = await supabase
        .from('bookmarks')
        .delete()
        .or(`user_id.eq.${userId},bookmarked_user_id.eq.${userId}`)

      if (bookmarksError) {
        console.error('Error deleting bookmarks:', bookmarksError)
        // Continue with other deletions even if this fails
      }

      // 6. Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('Error deleting profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to delete profile' },
          { status: 500 }
        )
      }

      // 7. Delete the auth user (this will cascade delete related auth data)
      const { error: userDeleteError } = await supabase.auth.admin.deleteUser(userId)

      if (userDeleteError) {
        console.error('Error deleting auth user:', userDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete user account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
        deletedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error during account deletion:', error)
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Delete account API error:', error)
    
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

