
-- ========== SCHEMA GROUP 4 ==========

-- 1) warranty_rules
CREATE TABLE public.warranty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  category_name text NOT NULL,
  deadline_months int NOT NULL,
  coverage_condition text,
  recommendation text,
  contract_clause text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.warranty_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_warranty_rules_org ON public.warranty_rules(organization_id);

CREATE POLICY "Staff read org warranty rules"
ON public.warranty_rules FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Customers read active warranty rules"
ON public.warranty_rules FOR SELECT TO authenticated
USING (active = true AND organization_id IN (
  SELECT d.organization_id FROM unit_memberships um
  JOIN units u ON u.id = um.unit_id
  JOIN blocks b ON b.id = u.block_id
  JOIN developments d ON d.id = b.development_id
  WHERE um.user_id = auth.uid() AND um.active = true
));

CREATE POLICY "Staff manage warranty rules"
ON public.warranty_rules FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update warranty rules"
ON public.warranty_rules FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 2) calendar_custom_events
CREATE TABLE public.calendar_custom_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  unit_id uuid REFERENCES public.units(id),
  title text NOT NULL,
  event_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  detail text,
  visible_to_customer boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_custom_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cal_events_org ON public.calendar_custom_events(organization_id);
CREATE INDEX idx_cal_events_unit ON public.calendar_custom_events(unit_id);
CREATE INDEX idx_cal_events_starts ON public.calendar_custom_events(starts_at);

CREATE POLICY "Customers read visible calendar events"
ON public.calendar_custom_events FOR SELECT TO authenticated
USING (visible_to_customer = true AND (
  unit_id IS NULL OR unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true)
));

CREATE POLICY "Staff read org calendar events"
ON public.calendar_custom_events FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff insert calendar events"
ON public.calendar_custom_events FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update calendar events"
ON public.calendar_custom_events FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 3) inspection_types
CREATE TABLE public.inspection_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspection_types ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inspection_types_org ON public.inspection_types(organization_id);

CREATE POLICY "Anyone reads active inspection types"
ON public.inspection_types FOR SELECT TO authenticated
USING (active = true);

-- 4) inspection_slots
CREATE TABLE public.inspection_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  development_id uuid NOT NULL REFERENCES public.developments(id),
  inspection_type_id uuid NOT NULL REFERENCES public.inspection_types(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int NOT NULL DEFAULT 1,
  status text NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspection_slots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inspection_slots_org ON public.inspection_slots(organization_id);
CREATE INDEX idx_inspection_slots_dev ON public.inspection_slots(development_id);
CREATE INDEX idx_inspection_slots_starts ON public.inspection_slots(starts_at);

CREATE POLICY "Customers read available slots"
ON public.inspection_slots FOR SELECT TO authenticated
USING (status = 'available');

CREATE POLICY "Staff read org slots"
ON public.inspection_slots FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff manage slots"
ON public.inspection_slots FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update slots"
ON public.inspection_slots FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 5) inspection_bookings
CREATE TABLE public.inspection_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  inspection_type_id uuid NOT NULL REFERENCES public.inspection_types(id),
  slot_id uuid REFERENCES public.inspection_slots(id),
  booked_by uuid REFERENCES public.profiles(id),
  booking_status text NOT NULL,
  scheduled_at timestamptz,
  checklist_status text,
  customer_notes text,
  internal_notes text,
  term_signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_insp_bookings_org ON public.inspection_bookings(organization_id);
CREATE INDEX idx_insp_bookings_unit ON public.inspection_bookings(unit_id);
CREATE INDEX idx_insp_bookings_booked_by ON public.inspection_bookings(booked_by);
CREATE INDEX idx_insp_bookings_status ON public.inspection_bookings(booking_status);

CREATE TRIGGER set_inspection_bookings_updated_at
  BEFORE UPDATE ON public.inspection_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Customers read own bookings"
ON public.inspection_bookings FOR SELECT TO authenticated
USING (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Customers insert bookings"
ON public.inspection_bookings FOR INSERT TO authenticated
WITH CHECK (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Staff read org bookings"
ON public.inspection_bookings FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update bookings"
ON public.inspection_bookings FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 6) inspection_report_items
CREATE TABLE public.inspection_report_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_booking_id uuid NOT NULL REFERENCES public.inspection_bookings(id),
  room_name text NOT NULL,
  item_name text NOT NULL,
  result_status text NOT NULL,
  notes text,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.inspection_report_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_report_items_booking ON public.inspection_report_items(inspection_booking_id);

CREATE POLICY "Customers read own report items"
ON public.inspection_report_items FOR SELECT TO authenticated
USING (inspection_booking_id IN (
  SELECT id FROM inspection_bookings WHERE unit_id IN (
    SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true
  )
));

CREATE POLICY "Staff read org report items"
ON public.inspection_report_items FOR SELECT TO authenticated
USING (inspection_booking_id IN (
  SELECT id FROM inspection_bookings WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
));

CREATE POLICY "Staff insert report items"
ON public.inspection_report_items FOR INSERT TO authenticated
WITH CHECK (inspection_booking_id IN (
  SELECT id FROM inspection_bookings WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
));

-- 7) tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  opened_by uuid NOT NULL REFERENCES public.profiles(id),
  category_name text NOT NULL,
  room_name text,
  description text NOT NULL,
  public_status text NOT NULL,
  internal_status text NOT NULL,
  priority text NOT NULL,
  warranty_rule_id uuid REFERENCES public.warranty_rules(id),
  warranty_status text,
  assigned_to uuid REFERENCES public.profiles(id),
  estimated_deadline date,
  opened_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tickets_org ON public.tickets(organization_id);
CREATE INDEX idx_tickets_unit ON public.tickets(unit_id);
CREATE INDEX idx_tickets_opened_by ON public.tickets(opened_by);
CREATE INDEX idx_tickets_public_status ON public.tickets(public_status);
CREATE INDEX idx_tickets_assigned ON public.tickets(assigned_to);

CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Customers read own tickets"
ON public.tickets FOR SELECT TO authenticated
USING (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Customers insert tickets"
ON public.tickets FOR INSERT TO authenticated
WITH CHECK (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Staff read org tickets"
ON public.tickets FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update tickets"
ON public.tickets FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 8) ticket_messages
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ticket_msgs_ticket ON public.ticket_messages(ticket_id);

CREATE POLICY "Customers read public messages"
ON public.ticket_messages FOR SELECT TO authenticated
USING (is_internal = false AND ticket_id IN (
  SELECT id FROM tickets WHERE unit_id IN (
    SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true
  )
));

CREATE POLICY "Customers insert messages"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (is_internal = false AND ticket_id IN (
  SELECT id FROM tickets WHERE unit_id IN (
    SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true
  )
));

CREATE POLICY "Staff read org messages"
ON public.ticket_messages FOR SELECT TO authenticated
USING (ticket_id IN (
  SELECT id FROM tickets WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
));

CREATE POLICY "Staff insert messages"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (ticket_id IN (
  SELECT id FROM tickets WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
));

-- 9) service_catalog
CREATE TABLE public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  price_label text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_service_catalog_org ON public.service_catalog(organization_id);

CREATE POLICY "Anyone reads active services"
ON public.service_catalog FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Staff manage service catalog"
ON public.service_catalog FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update service catalog"
ON public.service_catalog FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- 10) service_requests
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  service_catalog_id uuid REFERENCES public.service_catalog(id),
  service_name_snapshot text,
  description text,
  request_status text NOT NULL,
  quoted_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_service_requests_org ON public.service_requests(organization_id);
CREATE INDEX idx_service_requests_unit ON public.service_requests(unit_id);

CREATE TRIGGER set_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Customers read own service requests"
ON public.service_requests FOR SELECT TO authenticated
USING (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Customers insert service requests"
ON public.service_requests FOR INSERT TO authenticated
WITH CHECK (unit_id IN (SELECT unit_id FROM unit_memberships WHERE user_id = auth.uid() AND active = true));

CREATE POLICY "Staff read org service requests"
ON public.service_requests FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update service requests"
ON public.service_requests FOR UPDATE TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
