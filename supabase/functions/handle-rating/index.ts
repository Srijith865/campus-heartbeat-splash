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

    const { rated_id, rating_value } = await req.json()

    if (!rated_id || typeof rating_value !== 'number') {
      throw new Error('Missing required fields: rated_id and rating_value')
    }

    if (rating_value < 1 || rating_value > 10) {
      throw new Error('Rating must be between 1 and 10')
    }

    const rater_id = user.id

    console.log(`Rating: ${rater_id} rates ${rated_id} with ${rating_value}`)

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
      console.error('Error inserting rating:', ratingError)
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
        console.error('Error checking reverse rating:', reverseError)
      }

      // If both rated each other 8+, create a match
      if (reverseRating && reverseRating.rating_value >= 8) {
        console.log('Mutual high rating detected! Creating match...')

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
            console.error('Error creating match:', matchError)
          } else if (newMatch) {
            console.log('Match created:', newMatch.id)

            // Create a chat for this match
            const { error: chatError } = await supabase
              .from('chats')
              .insert({
                match_id: newMatch.id,
              })

            if (chatError) {
              console.error('Error creating chat:', chatError)
            } else {
              console.log('Chat created for match')
              matched = true
            }
          }
        } else {
          console.log('Match already exists')
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
    console.error('Error in handle-rating function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
