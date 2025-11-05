-- Fix: Sync existing auth users to profiles table and ensure trigger is set up correctly

-- First, drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    username,
    bio,
    personality,
    gender,
    age,
    interests,
    photos,
    main_photo_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    NEW.raw_user_meta_data->>'personality',
    NEW.raw_user_meta_data->>'gender',
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    COALESCE((NEW.raw_user_meta_data->>'interests')::jsonb, '[]'::jsonb),
    COALESCE(
      (SELECT array_agg(value::text) FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'photos')),
      ARRAY[]::text[]
    ),
    NEW.raw_user_meta_data->>'main_photo_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually sync existing auth users to profiles table
INSERT INTO public.profiles (
  id,
  email,
  username,
  bio,
  personality,
  gender,
  age,
  interests,
  photos,
  main_photo_url,
  is_visible,
  is_active
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'bio', 'Welcome to my profile!'),
  au.raw_user_meta_data->>'personality',
  au.raw_user_meta_data->>'gender',
  COALESCE((au.raw_user_meta_data->>'age')::integer, NULL),
  COALESCE((au.raw_user_meta_data->>'interests')::jsonb, '[]'::jsonb),
  COALESCE(
    (SELECT array_agg(value::text) FROM jsonb_array_elements_text(au.raw_user_meta_data->'photos')),
    ARRAY[]::text[]
  ),
  au.raw_user_meta_data->>'main_photo_url',
  true,
  true
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);