ALTER TABLE public.parts_catalog ADD COLUMN IF NOT EXISTS subcategory text;

-- Repuestos
UPDATE public.parts_catalog SET subcategory = 'Piñones'     WHERE name ILIKE 'Piñones%';
UPDATE public.parts_catalog SET subcategory = 'Casquillos'  WHERE name ILIKE 'Casquillos%';
UPDATE public.parts_catalog SET subcategory = 'Cepillos'    WHERE name ILIKE 'Cepillo%';
UPDATE public.parts_catalog SET subcategory = 'Transmisión' WHERE name ILIKE 'Conjuntos de transmisión%';
UPDATE public.parts_catalog SET subcategory = 'Fijación'    WHERE name ILIKE 'Clip%';
UPDATE public.parts_catalog SET subcategory = 'Cables'      WHERE name ILIKE 'Cable%';
UPDATE public.parts_catalog SET subcategory = 'Anillos'     WHERE name ILIKE 'Anillos%';

-- Averías
UPDATE public.parts_catalog SET subcategory = 'Motor'               WHERE name ILIKE 'Reparación cable entrada motor%' OR name ILIKE 'Reparación bloque motor%';
UPDATE public.parts_catalog SET subcategory = 'Fuente de alimentación' WHERE name ILIKE 'Reparación fuente de alimentación%';
