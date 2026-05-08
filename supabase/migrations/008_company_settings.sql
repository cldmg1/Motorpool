CREATE TABLE IF NOT EXISTS public.company_settings (
  id       integer PRIMARY KEY DEFAULT 1,
  name     text NOT NULL DEFAULT 'MotorPool SAT',
  email    text NOT NULL DEFAULT 'infomotorpoolsat@gmail.com',
  phone    text,
  address  text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_authenticated"
  ON public.company_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_all_admin"
  ON public.company_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.company_settings (id, name, email)
VALUES (1, 'MotorPool SAT', 'infomotorpoolsat@gmail.com')
ON CONFLICT DO NOTHING;
