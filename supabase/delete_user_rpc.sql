-- RPC to delete a user from auth.users (cascading to profiles)
-- SECURITY DEFINER allows it to bypass RLS for auth.users management
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 1. Check if the caller is an admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Admin access required');
  END IF;

  -- 2. Delete from auth.users (This triggers ON DELETE CASCADE for profiles)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
