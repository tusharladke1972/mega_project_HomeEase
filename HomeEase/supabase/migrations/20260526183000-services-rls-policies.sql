-- Add INSERT, UPDATE, and DELETE policies for public.services
-- to allow service providers to manage their own services.

DROP POLICY IF EXISTS "Providers can insert services" ON public.services;
CREATE POLICY "Providers can insert services" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can update their own services" ON public.services;
CREATE POLICY "Providers can update their own services" ON public.services
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT service_id FROM public.provider_services ps
      JOIN public.service_providers sp ON ps.provider_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT service_id FROM public.provider_services ps
      JOIN public.service_providers sp ON ps.provider_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can delete their own services" ON public.services;
CREATE POLICY "Providers can delete their own services" ON public.services
  FOR DELETE TO authenticated
  USING (
    id IN (
      SELECT service_id FROM public.provider_services ps
      JOIN public.service_providers sp ON ps.provider_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );
