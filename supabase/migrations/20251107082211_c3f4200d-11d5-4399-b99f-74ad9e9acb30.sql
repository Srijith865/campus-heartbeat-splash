-- Fix the handle_new_user trigger to properly handle JSONB data
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    email,
    bio,
    age,
    personality,
    gender,
    interests,
    photos,
    main_photo_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data->>'personality', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE(NEW.raw_user_meta_data->'interests', '[]'::jsonb),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'photos')),
      ARRAY[]::text[]
    ),
    COALESCE(NEW.raw_user_meta_data->>'main_photo_url', NULL)
  );
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();