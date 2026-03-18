
-- Allow platform admins and org_admins to INSERT developments
CREATE POLICY "Platform admins insert developments"
  ON public.developments FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

CREATE POLICY "Org admins insert developments"
  ON public.developments FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow platform admins and org_admins to UPDATE developments
CREATE POLICY "Platform admins update developments"
  ON public.developments FOR UPDATE TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Org admins update developments"
  ON public.developments FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));
