
-- ============================================
-- Schema Group 5: Knowledge Base & Audit
-- ============================================

-- 1) knowledge_sources
CREATE TABLE public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  source_type text NOT NULL,
  document_id uuid REFERENCES public.documents(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read org knowledge sources" ON public.knowledge_sources
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Staff insert knowledge sources" ON public.knowledge_sources
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Staff update knowledge sources" ON public.knowledge_sources
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- 2) knowledge_chunks (without vector for now - extension can be enabled later)
CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_source_id uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read org knowledge chunks" ON public.knowledge_chunks
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Staff insert knowledge chunks" ON public.knowledge_chunks
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- 3) audit_events
CREATE TABLE public.audit_events (
  id bigserial PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id),
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read org audit events" ON public.audit_events
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Authenticated insert audit events" ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_knowledge_chunks_source ON public.knowledge_chunks(knowledge_source_id);
CREATE INDEX idx_knowledge_sources_org ON public.knowledge_sources(organization_id);
CREATE INDEX idx_audit_events_org ON public.audit_events(organization_id);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_created ON public.audit_events(created_at DESC);
