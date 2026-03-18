
-- 1) document_categories table
CREATE TABLE IF NOT EXISTS public.document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  scope text NOT NULL DEFAULT 'geral',
  visible_to_customer boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage document_categories" ON public.document_categories FOR ALL TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());
CREATE POLICY "Org admins insert document_categories" ON public.document_categories FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
CREATE POLICY "Org admins update document_categories" ON public.document_categories FOR UPDATE TO authenticated USING (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
CREATE POLICY "Staff read org document_categories" ON public.document_categories FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Anyone reads active document_categories" ON public.document_categories FOR SELECT TO authenticated USING (active = true);

-- 2) Add document_category_id to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_category_id uuid REFERENCES public.document_categories(id);

-- 3) Add optional columns to warranty_rules
ALTER TABLE public.warranty_rules ADD COLUMN IF NOT EXISTS room_name text;
ALTER TABLE public.warranty_rules ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.warranty_rules ADD COLUMN IF NOT EXISTS priority_hint text;
ALTER TABLE public.warranty_rules ADD COLUMN IF NOT EXISTS visible_to_customer boolean DEFAULT true;
ALTER TABLE public.warranty_rules ADD COLUMN IF NOT EXISTS inactive_reason text;

-- 4) Add optional columns to service_catalog
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS service_code text;
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS estimated_delivery_days integer;
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS visible_to_customer boolean DEFAULT true;

-- 5) Org admins manage service_catalog
CREATE POLICY "Org admins insert service_catalog" ON public.service_catalog FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
CREATE POLICY "Org admins update service_catalog" ON public.service_catalog FOR UPDATE TO authenticated USING (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
CREATE POLICY "Staff read org service_catalog" ON public.service_catalog FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- 6) Org admins manage warranty_rules
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_rules' AND policyname = 'Org admins insert warranty_rules') THEN
    CREATE POLICY "Org admins insert warranty_rules" ON public.warranty_rules FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_rules' AND policyname = 'Org admins update warranty_rules') THEN
    CREATE POLICY "Org admins update warranty_rules" ON public.warranty_rules FOR UPDATE TO authenticated USING (organization_id IN (SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warranty_rules' AND policyname = 'Staff read org warranty_rules') THEN
    CREATE POLICY "Staff read org warranty_rules" ON public.warranty_rules FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
  END IF;
END $$;
