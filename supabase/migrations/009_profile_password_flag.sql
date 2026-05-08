ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_changed_password boolean NOT NULL DEFAULT false;
