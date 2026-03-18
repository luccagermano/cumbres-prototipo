
-- Schema Group 2: Finance tables

-- 1) sales_contracts
CREATE TABLE public.sales_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  contract_number text NOT NULL,
  contract_status text NOT NULL DEFAULT 'active',
  total_contract_value numeric(12,2) NOT NULL,
  down_payment_amount numeric(12,2) DEFAULT 0,
  financed_amount numeric(12,2) DEFAULT 0,
  bank_name text,
  financing_status text,
  signed_at timestamptz,
  handover_forecast_at timestamptz,
  handover_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, contract_number)
);

-- 2) journey_events
CREATE TABLE public.journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.sales_contracts(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  stage_key text NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamptz,
  visible_to_customer boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) receivables
CREATE TABLE public.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.sales_contracts(id),
  unit_id uuid NOT NULL REFERENCES public.units(id),
  sequence_no int,
  title text NOT NULL,
  charge_type text NOT NULL,
  due_date date NOT NULL,
  original_amount numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0,
  interest_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES public.receivables(id),
  paid_amount numeric(12,2) NOT NULL,
  paid_at timestamptz NOT NULL,
  payment_method text,
  reference_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes on foreign keys and common query fields
CREATE INDEX idx_sales_contracts_org ON public.sales_contracts(organization_id);
CREATE INDEX idx_sales_contracts_unit ON public.sales_contracts(unit_id);
CREATE INDEX idx_sales_contracts_status ON public.sales_contracts(contract_status);
CREATE INDEX idx_journey_events_contract ON public.journey_events(contract_id);
CREATE INDEX idx_journey_events_unit ON public.journey_events(unit_id);
CREATE INDEX idx_receivables_contract ON public.receivables(contract_id);
CREATE INDEX idx_receivables_unit ON public.receivables(unit_id);
CREATE INDEX idx_receivables_status ON public.receivables(status);
CREATE INDEX idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX idx_payments_receivable ON public.payments(receivable_id);

-- updated_at triggers
CREATE TRIGGER set_updated_at_sales_contracts BEFORE UPDATE ON public.sales_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at_receivables BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.sales_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_contracts
-- Customers can read contracts for their units
CREATE POLICY "Customers read own contracts" ON public.sales_contracts
  FOR SELECT TO authenticated
  USING (
    unit_id IN (
      SELECT um.unit_id FROM public.unit_memberships um
      WHERE um.user_id = auth.uid() AND um.active = true
    )
  );

-- Staff can read all contracts in their org
CREATE POLICY "Staff read org contracts" ON public.sales_contracts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

-- Staff can insert/update contracts
CREATE POLICY "Staff insert contracts" ON public.sales_contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

CREATE POLICY "Staff update contracts" ON public.sales_contracts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

-- RLS for journey_events
CREATE POLICY "Customers read visible journey events" ON public.journey_events
  FOR SELECT TO authenticated
  USING (
    visible_to_customer = true AND unit_id IN (
      SELECT um.unit_id FROM public.unit_memberships um
      WHERE um.user_id = auth.uid() AND um.active = true
    )
  );

CREATE POLICY "Staff read org journey events" ON public.journey_events
  FOR SELECT TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM public.units u
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      JOIN public.organization_memberships om ON om.organization_id = d.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
    )
  );

CREATE POLICY "Staff insert journey events" ON public.journey_events
  FOR INSERT TO authenticated
  WITH CHECK (
    unit_id IN (
      SELECT u.id FROM public.units u
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      JOIN public.organization_memberships om ON om.organization_id = d.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent', 'support_agent')
    )
  );

-- RLS for receivables
CREATE POLICY "Customers read own receivables" ON public.receivables
  FOR SELECT TO authenticated
  USING (
    unit_id IN (
      SELECT um.unit_id FROM public.unit_memberships um
      WHERE um.user_id = auth.uid() AND um.active = true
    )
  );

CREATE POLICY "Staff read org receivables" ON public.receivables
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT sc.id FROM public.sales_contracts sc
      JOIN public.organization_memberships om ON om.organization_id = sc.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

CREATE POLICY "Staff insert receivables" ON public.receivables
  FOR INSERT TO authenticated
  WITH CHECK (
    contract_id IN (
      SELECT sc.id FROM public.sales_contracts sc
      JOIN public.organization_memberships om ON om.organization_id = sc.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

CREATE POLICY "Staff update receivables" ON public.receivables
  FOR UPDATE TO authenticated
  USING (
    contract_id IN (
      SELECT sc.id FROM public.sales_contracts sc
      JOIN public.organization_memberships om ON om.organization_id = sc.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

-- RLS for payments
CREATE POLICY "Customers read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    receivable_id IN (
      SELECT r.id FROM public.receivables r
      WHERE r.unit_id IN (
        SELECT um.unit_id FROM public.unit_memberships um
        WHERE um.user_id = auth.uid() AND um.active = true
      )
    )
  );

CREATE POLICY "Staff read org payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    receivable_id IN (
      SELECT r.id FROM public.receivables r
      JOIN public.sales_contracts sc ON sc.id = r.contract_id
      JOIN public.organization_memberships om ON om.organization_id = sc.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );

CREATE POLICY "Staff insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    receivable_id IN (
      SELECT r.id FROM public.receivables r
      JOIN public.sales_contracts sc ON sc.id = r.contract_id
      JOIN public.organization_memberships om ON om.organization_id = sc.organization_id
      WHERE om.user_id = auth.uid() AND om.active = true
      AND om.role IN ('org_admin', 'finance_agent')
    )
  );
