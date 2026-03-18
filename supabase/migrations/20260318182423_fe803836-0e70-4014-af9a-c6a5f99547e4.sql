-- Allow platform admins to insert organization memberships
CREATE POLICY "Platform admins insert memberships"
ON public.organization_memberships
FOR INSERT
TO authenticated
WITH CHECK (is_platform_admin());

-- Allow platform admins to update organization memberships
CREATE POLICY "Platform admins update memberships"
ON public.organization_memberships
FOR UPDATE
TO authenticated
USING (is_platform_admin());

-- Allow org_admin to insert memberships in their own org
CREATE POLICY "Org admins insert org memberships"
ON public.organization_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'org_admin')
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- Allow org_admin to update memberships in their own org
CREATE POLICY "Org admins update org memberships"
ON public.organization_memberships
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'org_admin')
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);