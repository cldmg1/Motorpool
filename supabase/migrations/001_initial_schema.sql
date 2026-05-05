-- =============================================
-- MotorPool SAT — Initial Schema
-- =============================================

-- ── profiles ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'technician' CHECK (role IN ('technician', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── parts_catalog ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.parts_catalog (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parts_select_authenticated"
  ON public.parts_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "parts_all_admin"
  ON public.parts_catalog FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── diagnostics ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cliente              text NOT NULL,
  modelo               text NOT NULL,
  filtro               text,
  fuente_alimentacion  text,
  horas_motor          numeric,
  horas_fuente         numeric,
  descripcion_averia   text,
  status               text NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diagnostics_select_own"
  ON public.diagnostics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "diagnostics_select_admin"
  ON public.diagnostics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "diagnostics_insert_own"
  ON public.diagnostics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diagnostics_update_own"
  ON public.diagnostics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "diagnostics_update_admin"
  ON public.diagnostics FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "diagnostics_delete_own"
  ON public.diagnostics FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "diagnostics_delete_admin"
  ON public.diagnostics FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── diagnostic_items ──────────────────────────
CREATE TABLE IF NOT EXISTS public.diagnostic_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id  uuid NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
  part_id        uuid REFERENCES public.parts_catalog(id),
  custom_name    text,
  quantity       integer NOT NULL CHECK (quantity > 0),
  CONSTRAINT item_has_name CHECK (part_id IS NOT NULL OR custom_name IS NOT NULL)
);

ALTER TABLE public.diagnostic_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_all_via_diagnostic"
  ON public.diagnostic_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.diagnostics d
      WHERE d.id = diagnostic_items.diagnostic_id
      AND (
        d.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- ── diagnostic_photos ─────────────────────────
CREATE TABLE IF NOT EXISTS public.diagnostic_photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id  uuid NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
  storage_path   text NOT NULL,
  file_name      text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_all_via_diagnostic"
  ON public.diagnostic_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.diagnostics d
      WHERE d.id = diagnostic_photos.diagnostic_id
      AND (
        d.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- ── Trigger: auto-create profile on signup ────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── updated_at trigger ────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER diagnostics_updated_at
  BEFORE UPDATE ON public.diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Seed: default 15 parts ────────────────────
INSERT INTO public.parts_catalog (name, sort_order) VALUES
  ('Reparación cable entrada motor', 1),
  ('Reparación bloque motor', 2),
  ('Reparación fuente de alimentación', 3),
  ('Piñones 17 dientes', 4),
  ('Piñones 27 dientes', 5),
  ('Piñones 12 dientes', 6),
  ('Piñones 32 dientes', 7),
  ('Casquillos eje rueda', 8),
  ('Conjuntos de transmisión', 9),
  ('Clip fijación', 10),
  ('Casquillos exteriores', 11),
  ('Cepillo inferior rotativo doble', 12),
  ('Cable manguera nuevo', 13),
  ('Anillos PVA', 14),
  ('Cepillo delantero', 15)
ON CONFLICT DO NOTHING;
