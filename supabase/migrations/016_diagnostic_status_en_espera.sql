ALTER TABLE public.diagnostics
  DROP CONSTRAINT IF EXISTS diagnostics_status_check;

ALTER TABLE public.diagnostics
  ADD CONSTRAINT diagnostics_status_check
  CHECK (status IN ('draft', 'en_espera', 'completed'));
