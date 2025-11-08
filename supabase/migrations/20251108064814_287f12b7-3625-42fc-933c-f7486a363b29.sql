-- Drop and recreate the update policy with a simpler check
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create update policy that only checks user ownership, not field values
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);