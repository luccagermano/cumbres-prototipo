
-- Allow platform admins and org_admins to INSERT blocks
CREATE POLICY "Platform admins insert blocks"
  ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

CREATE POLICY "Org admins insert blocks"
  ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (development_id IN (
    SELECT d.id FROM developments d
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow platform admins and org_admins to UPDATE blocks
CREATE POLICY "Platform admins update blocks"
  ON public.blocks FOR UPDATE TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Org admins update blocks"
  ON public.blocks FOR UPDATE TO authenticated
  USING (development_id IN (
    SELECT d.id FROM developments d
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));
