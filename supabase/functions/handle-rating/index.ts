import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body = await req.json()
    const { rated_id, rating_value } = body

    // Validate input format
    if (!rated_id || typeof rating_value !== 'number') {
      throw new Error('Missing required fields: rated_id and rating_value')
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(rated_id)) {
      throw new Error('Invalid rated_id format')
    }

    // Validate rating is integer between 1-10
    if (!Number.isInteger(rating_value) || rating_value < 1 || rating_value > 10) {
      throw new Error('Rating must be an integer between 1 and 10')
    }

    const rater_id = user.id

    // Prevent self-rating
    if (rated_id === rater_id) {
      throw new Error('Cannot rate yourself')
    }

    // Verify rated user exists
    const { data: ratedUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', rated_id)
      .single()

    if (userCheckError || !ratedUser) {
      throw new Error('Rated user not found')
    }

    // Insert or update the rating
    const { error: ratingError } = await supabase
      .from('ratings')
      .upsert({
        rater_id,
        rated_id,
        rating_value,
      }, {
        onConflict: 'rater_id,rated_id'
      })

    if (ratingError) {
      throw ratingError
    }

    let matched = false
    let shouldNotify = rating_value >= 5

    // Check if both users rated each other 8 or above
    if (rating_value >= 8) {
      // Check for reverse rating
      const { data: reverseRating, error: reverseError } = await supabase
        .from('ratings')
        .select('rating_value')
        .eq('rater_id', rated_id)
        .eq('rated_id', rater_id)
        .maybeSingle()

      if (reverseError) {
        // Continue without blocking the rating
      }

      // If both rated each other 8+, create a match
      if (reverseRating && reverseRating.rating_value >= 8) {

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${rater_id},user2_id.eq.${rated_id}),and(user1_id.eq.${rated_id},user2_id.eq.${rater_id})`)
          .maybeSingle()

        if (!existingMatch) {
          // Create the match
          const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: rater_id,
              user2_id: rated_id,
            })
            .select()
            .single()

          if (matchError) {
            // Match creation failed
          } else if (newMatch) {

            // Create a chat for this match
            const { error: chatError } = await supabase
              .from('chats')
              .insert({
                match_id: newMatch.id,
              })

            if (chatError) {
              // Chat creation failed
            } else {
              matched = true
            }
          }
        } else {
          matched = true
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched,
        shouldNotify,
        message: matched ? 'Match created!' : shouldNotify ? 'Rating recorded, user will be notified' : 'Rating recorded'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
