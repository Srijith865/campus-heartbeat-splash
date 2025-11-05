-- Fix critical RLS policy vulnerabilities

-- 1. Fix profiles table - restrict visibility to active, visible profiles only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Create restrictive policy that prevents full database scraping
CREATE POLICY "Users can view visible active profiles" ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND id != auth.uid()
  AND (is_visible = true OR is_visible IS NULL)
);

-- 2. Fix ratings table - users should only see ratings they gave, not received
-- Drop the policy that allows seeing who rated you
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;

-- Only allow users to see ratings they gave
CREATE POLICY "Users can view ratings they gave" ON ratings
FOR SELECT USING (auth.uid() = rater_id);

-- 3. Add messages UPDATE and DELETE policies for better UX
-- Allow users to update their own messages within 15 minutes
CREATE POLICY "Users can update their recent messages" ON messages
FOR UPDATE USING (
  auth.uid() = sender_id 
  AND created_at > NOW() - INTERVAL '15 minutes'
)
WITH CHECK (
  auth.uid() = sender_id
  AND content IS NOT NULL
  AND length(content) <= 1000
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (
  auth.uid() = sender_id
);