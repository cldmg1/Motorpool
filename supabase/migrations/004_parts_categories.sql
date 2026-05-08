-- Assign categories to existing parts
UPDATE public.parts_catalog
SET category = 'averias'
WHERE name ILIKE 'Reparación%';

UPDATE public.parts_catalog
SET category = 'repuestos'
WHERE category IS NULL;
