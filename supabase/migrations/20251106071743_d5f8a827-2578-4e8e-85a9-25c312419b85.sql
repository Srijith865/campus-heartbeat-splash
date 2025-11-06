-- Drop the old policy that prevents users from seeing their own profile
DROP POLICY IF EXISTS "Users can view visible active profiles" ON profiles;

-- Create new policy that allows users to see all visible profiles including their own
CREATE POLICY "Users can view all visible profiles"
ON profiles
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  ((is_visible = true) OR (is_visible IS NULL))
);