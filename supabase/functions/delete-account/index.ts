import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Delete user's data in order (respecting foreign key constraints)
    // 1. Delete message reactions
    await supabaseClient
      .from('message_reactions')
      .delete()
      .eq('user_id', user.id)

    // 2. Delete messages sent by user
    await supabaseClient
      .from('messages')
      .delete()
      .eq('sender_id', user.id)

    // 3. Delete chats where user is involved (via matches)
    const { data: userMatches } = await supabaseClient
      .from('matches')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (userMatches && userMatches.length > 0) {
      const matchIds = userMatches.map(m => m.id)
      await supabaseClient
        .from('chats')
        .delete()
        .in('match_id', matchIds)
    }

    // 4. Delete matches
    await supabaseClient
      .from('matches')
      .delete()
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    // 5. Delete ratings given
    await supabaseClient
      .from('ratings')
      .delete()
      .eq('rater_id', user.id)

    // 6. Delete ratings received
    await supabaseClient
      .from('ratings')
      .delete()
      .eq('rated_id', user.id)

    // 7. Delete bookmarks
    await supabaseClient
      .from('bookmarks')
      .delete()
      .or(`user_id.eq.${user.id},bookmarked_user_id.eq.${user.id}`)

    // 8. Delete profile
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user.id)

    // 9. Finally, delete the auth user
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
