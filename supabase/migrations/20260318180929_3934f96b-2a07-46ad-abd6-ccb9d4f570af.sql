
-- Allow platform admins and org_admins to INSERT units
CREATE POLICY "Platform admins insert units"
  ON public.units FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

CREATE POLICY "Org admins insert units"
  ON public.units FOR INSERT TO authenticated
  WITH CHECK (block_id IN (
    SELECT b.id FROM blocks b
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow platform admins and org_admins to UPDATE units
CREATE POLICY "Platform admins update units"
  ON public.units FOR UPDATE TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Org admins update units"
  ON public.units FOR UPDATE TO authenticated
  USING (block_id IN (
    SELECT b.id FROM blocks b
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Authenticated users can read all units (needed for customer portal too)
-- Already exists: "Authenticated read units" policy is not present, let's check
-- Actually units has no SELECT policy for authenticated, let's add one
CREATE POLICY "Authenticated read units"
  ON public.units FOR SELECT TO authenticated
  USING (true);
