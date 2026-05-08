-- =============================================
-- Security hardening: fix role escalation
-- =============================================

-- M5: Hardcode role='technician' in handle_new_user trigger
-- Prevents user_metadata.role from being trusted to assign admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'technician'  -- always technician; admins promoted manually
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- M6: Prevent self role-escalation via profiles_update_own
-- WITH CHECK ensures users cannot change their own role or id
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- M7: Tighten parts_catalog write RLS — already done in code, belt-and-suspenders
-- Already correct from migration 001 (parts_all_admin policy checks role = 'admin')
