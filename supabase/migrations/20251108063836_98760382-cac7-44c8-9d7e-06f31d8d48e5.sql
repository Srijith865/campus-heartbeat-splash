-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a more permissive update policy that allows users to update their own profile fields
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);