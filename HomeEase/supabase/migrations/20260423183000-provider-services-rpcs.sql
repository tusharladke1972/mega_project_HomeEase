-- Provider service mapping table and RPCs used by the frontend.

CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (provider_id, service_id)
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can manage their own mapped services" ON public.provider_services;
CREATE POLICY "Providers can manage their own mapped services"
  ON public.provider_services
  FOR ALL
  USING (
    provider_id IN (
      SELECT id
      FROM public.service_providers
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id
      FROM public.service_providers
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view active provider services" ON public.provider_services;
CREATE POLICY "Authenticated users can view active provider services"
  ON public.provider_services
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE OR REPLACE FUNCTION public.get_provider_services(provider_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category public.service_category,
  base_price NUMERIC,
  duration_minutes INTEGER,
  is_active BOOLEAN,
  provider_service_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.description,
    s.category,
    COALESCE(ps.custom_price, s.base_price) AS base_price,
    s.duration_minutes,
    ps.is_active,
    ps.id AS provider_service_id
  FROM public.provider_services ps
  JOIN public.services s ON s.id = ps.service_id
  WHERE ps.provider_id = get_provider_services.provider_id
  ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.add_provider_service(
  provider_user_id UUID,
  service_name TEXT,
  service_description TEXT,
  service_category public.service_category,
  service_base_price NUMERIC,
  service_duration_minutes INTEGER,
  custom_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_service_id UUID;
BEGIN
  SELECT id
  INTO v_provider_id
  FROM public.service_providers
  WHERE user_id = provider_user_id
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Provider profile not found');
  END IF;

  INSERT INTO public.services (name, description, category, base_price, duration_minutes, is_active)
  VALUES (service_name, service_description, service_category, service_base_price, service_duration_minutes, TRUE)
  RETURNING id INTO v_service_id;

  INSERT INTO public.provider_services (provider_id, service_id, custom_price, is_active)
  VALUES (v_provider_id, v_service_id, custom_price, TRUE);

  RETURN jsonb_build_object('success', TRUE, 'service_id', v_service_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_provider_service(
  provider_user_id UUID,
  provider_service_id UUID,
  new_custom_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
BEGIN
  SELECT id
  INTO v_provider_id
  FROM public.service_providers
  WHERE user_id = provider_user_id
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Provider profile not found');
  END IF;

  UPDATE public.provider_services
  SET custom_price = new_custom_price
  WHERE id = update_provider_service.provider_service_id
    AND provider_id = v_provider_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Service mapping not found');
  END IF;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_provider_service_by_id(
  provider_user_id UUID,
  provider_service_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
BEGIN
  SELECT id
  INTO v_provider_id
  FROM public.service_providers
  WHERE user_id = provider_user_id
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Provider profile not found');
  END IF;

  DELETE FROM public.provider_services
  WHERE id = delete_provider_service_by_id.provider_service_id
    AND provider_id = v_provider_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Service mapping not found');
  END IF;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_provider_services(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_provider_service(UUID, TEXT, TEXT, public.service_category, NUMERIC, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_provider_service(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_provider_service_by_id(UUID, UUID) TO authenticated;
