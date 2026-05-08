-- Allow all authenticated users to manage parts catalog
DROP POLICY IF EXISTS "parts_all_admin" ON public.parts_catalog;

CREATE POLICY "parts_write_authenticated"
  ON public.parts_catalog FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
