-- Número de serie on diagnostics
ALTER TABLE public.diagnostics ADD COLUMN IF NOT EXISTS numero_serie text;

-- Closed_at timestamp for resolution time
ALTER TABLE public.diagnostics ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Quote status
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Client signature on quotes (text, e.g. full name of who approved)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS firma_cliente text;
