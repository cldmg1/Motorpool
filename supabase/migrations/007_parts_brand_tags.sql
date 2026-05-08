ALTER TABLE public.parts_catalog ADD COLUMN IF NOT EXISTS brand_tags text[] DEFAULT '{}';
