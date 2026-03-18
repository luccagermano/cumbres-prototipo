
-- Fix infinite recursion on organization_memberships RLS
-- Drop the recursive policy and replace with security definer function approach
DROP POLICY IF EXISTS "Org admins read org memberships" ON public.organization_memberships;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_memberships
  WHERE user_id = _user_id AND active = true;
$$;

CREATE POLICY "Org admins read org memberships"
ON public.organization_memberships
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'org_admin') 
  AND organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
);

-- Also fix organizations policy that references organization_memberships (potential recursion)
DROP POLICY IF EXISTS "Members read own org" ON public.organizations;
CREATE POLICY "Members read own org"
ON public.organizations
FOR SELECT TO authenticated
USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Fix units policy that joins through organization_memberships
DROP POLICY IF EXISTS "Org members read units" ON public.units;
CREATE POLICY "Customers read own units"
ON public.units
FOR SELECT TO authenticated
USING (id IN (SELECT unit_id FROM public.unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Staff read org units"
ON public.units
FOR SELECT TO authenticated
USING (block_id IN (
  SELECT b.id FROM blocks b
  JOIN developments d ON d.id = b.development_id
  WHERE d.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
));

-- ========== SCHEMA GROUP 3 ==========

-- 1) documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  development_id uuid REFERENCES public.developments(id),
  unit_id uuid REFERENCES public.units(id),
  contract_id uuid REFERENCES public.sales_contracts(id),
  receivable_id uuid REFERENCES public.receivables(id),
  ticket_id uuid,
  inspection_booking_id uuid,
  service_request_id uuid,
  title text NOT NULL,
  category text NOT NULL,
  file_name text NOT NULL,
  bucket text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  version_no int NOT NULL DEFAULT 1,
  visible_to_customer boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_documents_org ON public.documents(organization_id);
CREATE INDEX idx_documents_unit ON public.documents(unit_id);
CREATE INDEX idx_documents_contract ON public.documents(contract_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

CREATE POLICY "Customers read visible docs for own units"
ON public.documents FOR SELECT TO authenticated
USING (visible_to_customer = true AND unit_id IN (
  SELECT unit_id FROM public.unit_memberships WHERE user_id = auth.uid() AND active = true
));

CREATE POLICY "Staff read org docs"
ON public.documents FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff insert docs"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 2) faq_categories
CREATE TABLE public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_faq_categories_org ON public.faq_categories(organization_id);

CREATE POLICY "Anyone reads active faq categories"
ON public.faq_categories FOR SELECT TO authenticated
USING (active = true);

-- 3) faq_articles
CREATE TABLE public.faq_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  faq_category_id uuid REFERENCES public.faq_categories(id),
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  body_md text NOT NULL,
  audience text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_faq_articles_org ON public.faq_articles(organization_id);
CREATE INDEX idx_faq_articles_category ON public.faq_articles(faq_category_id);

CREATE TRIGGER set_faq_articles_updated_at
  BEFORE UPDATE ON public.faq_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Anyone reads active faq articles"
ON public.faq_articles FOR SELECT TO authenticated
USING (active = true);

-- 4) notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  unit_id uuid REFERENCES public.units(id),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

CREATE POLICY "Users read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- 5) leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  development_id uuid REFERENCES public.developments(id),
  source_type text NOT NULL,
  campaign_slug text,
  full_name text NOT NULL,
  phone text,
  email text,
  interest_subject text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_org ON public.leads(organization_id);
CREATE INDEX idx_leads_development ON public.leads(development_id);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Leads are inserted by anon (public forms) so we need anon insert
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Staff read org leads"
ON public.leads FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents-private', 'documents-private', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars-private', 'avatars-private', false);

-- Storage RLS for documents-private
CREATE POLICY "Staff upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents-private');

CREATE POLICY "Authenticated download documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents-private');

CREATE POLICY "Staff upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars-private');

CREATE POLICY "Authenticated download avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars-private');
