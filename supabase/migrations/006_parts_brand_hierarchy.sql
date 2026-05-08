ALTER TABLE public.parts_catalog ADD COLUMN IF NOT EXISTS brand_section text;    -- repuestos | averias (within brand)
ALTER TABLE public.parts_catalog ADD COLUMN IF NOT EXISTS brand_subsection text; -- Piñones, Motor, etc. (within brand section)
