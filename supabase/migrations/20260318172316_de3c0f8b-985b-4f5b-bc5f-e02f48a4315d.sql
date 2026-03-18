
-- 1) platform_admins table
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read the table
CREATE POLICY "Platform admins read platform_admins"
  ON public.platform_admins FOR SELECT TO authenticated
  USING (true);

-- Only existing platform admins can insert/update
CREATE POLICY "Platform admins manage platform_admins"
  ON public.platform_admins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND active = true));

-- 2) Security definer helper
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND active = true
  );
$$;

-- 3) Update RLS policies: add platform admin bypass to all org/unit-scoped tables
-- We'll add permissive SELECT/INSERT/UPDATE policies for platform admins

-- profiles: platform admins can read all profiles
CREATE POLICY "Platform admins read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- organizations
CREATE POLICY "Platform admins read all orgs"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- organization_memberships
CREATE POLICY "Platform admins read all memberships"
  ON public.organization_memberships FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- units
CREATE POLICY "Platform admins read all units"
  ON public.units FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- unit_memberships
CREATE POLICY "Platform admins read all unit_memberships"
  ON public.unit_memberships FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- blocks (already public read, but add for consistency)

-- developments (already public read)

-- sales_contracts
CREATE POLICY "Platform admins read all contracts"
  ON public.sales_contracts FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update contracts"
  ON public.sales_contracts FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- receivables
CREATE POLICY "Platform admins read all receivables"
  ON public.receivables FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update receivables"
  ON public.receivables FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert receivables"
  ON public.receivables FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- payments
CREATE POLICY "Platform admins read all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- documents
CREATE POLICY "Platform admins read all documents"
  ON public.documents FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins update documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- tickets
CREATE POLICY "Platform admins read all tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- ticket_messages
CREATE POLICY "Platform admins read all ticket_messages"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert ticket_messages"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- inspection_bookings
CREATE POLICY "Platform admins read all inspection_bookings"
  ON public.inspection_bookings FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update inspection_bookings"
  ON public.inspection_bookings FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- inspection_slots
CREATE POLICY "Platform admins read all inspection_slots"
  ON public.inspection_slots FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage inspection_slots"
  ON public.inspection_slots FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins update inspection_slots"
  ON public.inspection_slots FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- inspection_report_items
CREATE POLICY "Platform admins read all report_items"
  ON public.inspection_report_items FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert report_items"
  ON public.inspection_report_items FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- service_requests
CREATE POLICY "Platform admins read all service_requests"
  ON public.service_requests FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update service_requests"
  ON public.service_requests FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- service_catalog
CREATE POLICY "Platform admins manage service_catalog"
  ON public.service_catalog FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- notifications
CREATE POLICY "Platform admins read all notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- journey_events
CREATE POLICY "Platform admins read all journey_events"
  ON public.journey_events FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins insert journey_events"
  ON public.journey_events FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- calendar_custom_events
CREATE POLICY "Platform admins read all calendar_events"
  ON public.calendar_custom_events FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage calendar_events"
  ON public.calendar_custom_events FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins update calendar_events"
  ON public.calendar_custom_events FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- audit_events
CREATE POLICY "Platform admins read all audit_events"
  ON public.audit_events FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- knowledge_sources
CREATE POLICY "Platform admins manage knowledge_sources"
  ON public.knowledge_sources FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- knowledge_chunks
CREATE POLICY "Platform admins manage knowledge_chunks"
  ON public.knowledge_chunks FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- leads
CREATE POLICY "Platform admins read all leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- warranty_rules
CREATE POLICY "Platform admins read all warranty_rules"
  ON public.warranty_rules FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage warranty_rules"
  ON public.warranty_rules FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- faq_articles
CREATE POLICY "Platform admins manage faq_articles"
  ON public.faq_articles FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- faq_categories
CREATE POLICY "Platform admins manage faq_categories"
  ON public.faq_categories FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
