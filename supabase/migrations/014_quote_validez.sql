ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS fecha_validez date;
