
CREATE TABLE public.oil_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oil_code TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT,
  year TEXT,
  engine TEXT,
  oil_type TEXT,
  viscosity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oil_codes_oil_code ON public.oil_codes (oil_code);
CREATE INDEX idx_oil_codes_brand ON public.oil_codes (vehicle_brand);
CREATE INDEX idx_oil_codes_model ON public.oil_codes (vehicle_model);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oil_codes TO authenticated;
GRANT ALL ON public.oil_codes TO service_role;

ALTER TABLE public.oil_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view oil codes"
  ON public.oil_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert oil codes"
  ON public.oil_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update oil codes"
  ON public.oil_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete oil codes"
  ON public.oil_codes FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_oil_codes_updated_at
  BEFORE UPDATE ON public.oil_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
