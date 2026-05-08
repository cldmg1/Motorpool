ALTER TABLE public.diagnostics
  ADD COLUMN IF NOT EXISTS prioridad text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS tipo_intervencion text,
  ADD COLUMN IF NOT EXISTS fecha_entrega date,
  ADD COLUMN IF NOT EXISTS notas_internas text;
