CREATE TABLE IF NOT EXISTS public.quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnostic_id   uuid REFERENCES public.diagnostics(id) ON DELETE SET NULL,
  cliente         text NOT NULL,
  modelo          text NOT NULL,
  notas           text,
  iva_included    boolean NOT NULL DEFAULT true,
  iva_rate        numeric NOT NULL DEFAULT 21,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description  text NOT NULL,
  quantity     numeric NOT NULL DEFAULT 1,
  unit_price   numeric NOT NULL DEFAULT 0,
  sort_order   integer NOT NULL DEFAULT 0
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_own" ON public.quotes FOR ALL USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quote_items_via_quote" ON public.quote_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.quotes q WHERE q.id = quote_items.quote_id AND (
      q.user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);
