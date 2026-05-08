-- Create table if it doesn't exist yet (in case 008 was never applied)
CREATE TABLE IF NOT EXISTS public.company_settings (
  id         integer PRIMARY KEY DEFAULT 1,
  name       text NOT NULL DEFAULT 'MotorPool SAT',
  email      text NOT NULL DEFAULT 'infomotorpoolsat@gmail.com',
  phone      text,
  address    text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_settings' AND policyname = 'settings_select_authenticated'
  ) THEN
    CREATE POLICY "settings_select_authenticated"
      ON public.company_settings FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'company_settings' AND policyname = 'settings_all_admin'
  ) THEN
    CREATE POLICY "settings_all_admin"
      ON public.company_settings FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

INSERT INTO public.company_settings (id, name, email)
VALUES (1, 'MotorPool SAT', 'infomotorpoolsat@gmail.com')
ON CONFLICT DO NOTHING;

-- Add new columns
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS iva_default numeric NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS email_body text;
