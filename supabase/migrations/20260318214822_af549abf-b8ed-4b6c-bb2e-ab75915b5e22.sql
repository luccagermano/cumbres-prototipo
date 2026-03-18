
-- ticket_categories
CREATE TABLE public.ticket_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  audience text NOT NULL DEFAULT 'customer',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage ticket_categories" ON public.ticket_categories
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Staff read org ticket_categories" ON public.ticket_categories
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org admins insert ticket_categories" ON public.ticket_categories
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

CREATE POLICY "Org admins update ticket_categories" ON public.ticket_categories
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- ticket_subcategories
CREATE TABLE public.ticket_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_category_id uuid NOT NULL REFERENCES public.ticket_categories(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_category_id, name)
);

ALTER TABLE public.ticket_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage ticket_subcategories" ON public.ticket_subcategories
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Staff read org ticket_subcategories" ON public.ticket_subcategories
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org admins insert ticket_subcategories" ON public.ticket_subcategories
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

CREATE POLICY "Org admins update ticket_subcategories" ON public.ticket_subcategories
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Add optional FK columns to tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_category_id uuid REFERENCES public.ticket_categories(id),
  ADD COLUMN IF NOT EXISTS ticket_subcategory_id uuid REFERENCES public.ticket_subcategories(id);

-- Add columns to inspection_types
ALTER TABLE public.inspection_types
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS audience text DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS requires_term_signature boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add RLS for org_admin insert/update on inspection_types
CREATE POLICY "Org admins insert inspection_types" ON public.inspection_types
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

CREATE POLICY "Org admins update inspection_types" ON public.inspection_types
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

CREATE POLICY "Platform admins manage inspection_types" ON public.inspection_types
  FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- updated_at triggers
CREATE TRIGGER set_ticket_categories_updated_at BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_ticket_subcategories_updated_at BEFORE UPDATE ON public.ticket_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_inspection_types_updated_at BEFORE UPDATE ON public.inspection_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
