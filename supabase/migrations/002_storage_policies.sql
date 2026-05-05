-- ── Storage bucket policies (run after creating the bucket in Supabase dashboard) ──

-- Upload: users upload to their own folder: {user_id}/{diagnostic_id}/filename
CREATE POLICY "photos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'diagnostic-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: owner or admin
CREATE POLICY "photos_select_own_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'diagnostic-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Delete: owner or admin
CREATE POLICY "photos_delete_own_or_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'diagnostic-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
