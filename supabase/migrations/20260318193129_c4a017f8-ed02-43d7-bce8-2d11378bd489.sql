-- Add branding columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_path text,
  ADD COLUMN IF NOT EXISTS brand_primary_color text,
  ADD COLUMN IF NOT EXISTS brand_secondary_color text;

-- Create dedicated private bucket for organization assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets-private', 'organization-assets-private', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: platform admins can manage org assets
CREATE POLICY "Platform admins manage org assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'organization-assets-private' AND public.is_platform_admin())
WITH CHECK (bucket_id = 'organization-assets-private' AND public.is_platform_admin());

-- RLS: org admins can read their org assets
CREATE POLICY "Org admins read org assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-assets-private'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.organizations
    WHERE id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

-- Allow platform admins to insert/update organizations
CREATE POLICY "Platform admins insert organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins update organizations"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.is_platform_admin());