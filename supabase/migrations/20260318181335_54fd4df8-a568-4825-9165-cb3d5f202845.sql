
-- Allow platform admins to insert profiles (for creating customer profiles)
CREATE POLICY "Platform admins insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

-- Allow platform admins to read/manage unit_memberships
CREATE POLICY "Platform admins manage unit_memberships"
  ON public.unit_memberships FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Allow org_admins to read unit_memberships for units in their org
CREATE POLICY "Org admins read org unit_memberships"
  ON public.unit_memberships FOR SELECT TO authenticated
  USING (unit_id IN (
    SELECT u.id FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow org_admins to insert unit_memberships for units in their org
CREATE POLICY "Org admins insert unit_memberships"
  ON public.unit_memberships FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (
    SELECT u.id FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow org_admins to update unit_memberships for units in their org
CREATE POLICY "Org admins update unit_memberships"
  ON public.unit_memberships FOR UPDATE TO authenticated
  USING (unit_id IN (
    SELECT u.id FROM units u
    JOIN blocks b ON b.id = u.block_id
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true AND om.role = 'org_admin'
  ));

-- Allow org_admins to read profiles of customers linked to their org units
CREATE POLICY "Org admins read customer profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id IN (
    SELECT um.user_id FROM unit_memberships um
    JOIN units u ON u.id = um.unit_id
    JOIN blocks b ON b.id = u.block_id
    JOIN developments d ON d.id = b.development_id
    JOIN organization_memberships om2 ON om2.organization_id = d.organization_id
    WHERE om2.user_id = auth.uid() AND om2.active = true AND om2.role = 'org_admin'
  ));

-- Users read own memberships
CREATE POLICY "Users read own unit_memberships"
  ON public.unit_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());
