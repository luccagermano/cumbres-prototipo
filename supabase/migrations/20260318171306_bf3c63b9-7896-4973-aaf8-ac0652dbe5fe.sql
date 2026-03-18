
-- Storage policies - drop existing first then recreate
DROP POLICY IF EXISTS "Staff upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff read documents" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users read own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;

-- Documents-private: staff upload (org_admin + document_agent)
CREATE POLICY "Staff upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents-private'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
        AND om.role IN ('org_admin', 'document_agent')
    )
  );

-- Documents-private: staff read (any org member)
CREATE POLICY "Staff read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents-private'
    AND (storage.foldername(name))[1] IN (
      SELECT om.organization_id::text FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
    )
  );

-- Avatars-private: user manages own folder
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Also tighten knowledge sources/chunks (these were partially applied)
DROP POLICY IF EXISTS "Staff insert knowledge sources" ON public.knowledge_sources;
CREATE POLICY "Staff insert knowledge sources" ON public.knowledge_sources
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
        AND om.role = 'org_admin'
    )
  );

DROP POLICY IF EXISTS "Staff update knowledge sources" ON public.knowledge_sources;
CREATE POLICY "Staff update knowledge sources" ON public.knowledge_sources
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
        AND om.role = 'org_admin'
    )
  );

DROP POLICY IF EXISTS "Staff insert knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Staff insert knowledge chunks" ON public.knowledge_chunks
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.active = true
        AND om.role = 'org_admin'
    )
  );
