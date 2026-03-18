-- Security definer function to get unit IDs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_unit_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT unit_id FROM public.unit_memberships
  WHERE user_id = _user_id AND active = true;
$$;

-- Fix recursion: units "Customers read own units" references unit_memberships,
-- and unit_memberships "Org admins read org unit_memberships" references units.
-- Replace the units policy to use the security definer function.
DROP POLICY IF EXISTS "Customers read own units" ON public.units;
CREATE POLICY "Customers read own units" ON public.units
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_unit_ids(auth.uid())));

-- Fix profiles policy that also references unit_memberships (causing issues when unit_memberships RLS is evaluated)
DROP POLICY IF EXISTS "Org admins read customer profiles" ON public.profiles;
CREATE POLICY "Org admins read customer profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT um.user_id
      FROM public.unit_memberships um
      JOIN public.units u ON u.id = um.unit_id
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      WHERE d.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR
    is_platform_admin()
  );

-- Also fix other tables that reference unit_memberships in their SELECT policies
-- to use the security definer function, preventing future recursion issues

-- calendar_custom_events
DROP POLICY IF EXISTS "Customers read visible calendar events" ON public.calendar_custom_events;
CREATE POLICY "Customers read visible calendar events" ON public.calendar_custom_events
  FOR SELECT TO authenticated
  USING (
    visible_to_customer = true
    AND (unit_id IS NULL OR unit_id IN (SELECT get_user_unit_ids(auth.uid())))
  );

-- documents  
DROP POLICY IF EXISTS "Customers read visible docs for own units" ON public.documents;
CREATE POLICY "Customers read visible docs for own units" ON public.documents
  FOR SELECT TO authenticated
  USING (
    visible_to_customer = true
    AND unit_id IN (SELECT get_user_unit_ids(auth.uid()))
  );

-- inspection_bookings
DROP POLICY IF EXISTS "Customers read own bookings" ON public.inspection_bookings;
CREATE POLICY "Customers read own bookings" ON public.inspection_bookings
  FOR SELECT TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

DROP POLICY IF EXISTS "Customers insert bookings" ON public.inspection_bookings;
CREATE POLICY "Customers insert bookings" ON public.inspection_bookings
  FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- inspection_report_items
DROP POLICY IF EXISTS "Customers read own report items" ON public.inspection_report_items;
CREATE POLICY "Customers read own report items" ON public.inspection_report_items
  FOR SELECT TO authenticated
  USING (
    inspection_booking_id IN (
      SELECT ib.id FROM public.inspection_bookings ib
      WHERE ib.unit_id IN (SELECT get_user_unit_ids(auth.uid()))
    )
  );

-- journey_events
DROP POLICY IF EXISTS "Customers read visible journey events" ON public.journey_events;
CREATE POLICY "Customers read visible journey events" ON public.journey_events
  FOR SELECT TO authenticated
  USING (
    visible_to_customer = true
    AND unit_id IN (SELECT get_user_unit_ids(auth.uid()))
  );

-- receivables
DROP POLICY IF EXISTS "Customers read own receivables" ON public.receivables;
CREATE POLICY "Customers read own receivables" ON public.receivables
  FOR SELECT TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- sales_contracts
DROP POLICY IF EXISTS "Customers read own contracts" ON public.sales_contracts;
CREATE POLICY "Customers read own contracts" ON public.sales_contracts
  FOR SELECT TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- payments
DROP POLICY IF EXISTS "Customers read own payments" ON public.payments;
CREATE POLICY "Customers read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    receivable_id IN (
      SELECT r.id FROM public.receivables r
      WHERE r.unit_id IN (SELECT get_user_unit_ids(auth.uid()))
    )
  );

-- Remove duplicate unit_memberships SELECT policy
DROP POLICY IF EXISTS "Users read own unit memberships" ON public.unit_memberships;

-- Fix unit_memberships org admin policy to avoid cross-referencing units with RLS
DROP POLICY IF EXISTS "Org admins read org unit_memberships" ON public.unit_memberships;
CREATE POLICY "Org admins read org unit_memberships" ON public.unit_memberships
  FOR SELECT TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM public.units u
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      WHERE d.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Similarly fix INSERT and UPDATE policies
DROP POLICY IF EXISTS "Org admins insert unit_memberships" ON public.unit_memberships;
CREATE POLICY "Org admins insert unit_memberships" ON public.unit_memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    unit_id IN (
      SELECT u.id FROM public.units u
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      WHERE d.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Org admins update unit_memberships" ON public.unit_memberships;
CREATE POLICY "Org admins update unit_memberships" ON public.unit_memberships
  FOR UPDATE TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM public.units u
      JOIN public.blocks b ON b.id = u.block_id
      JOIN public.developments d ON d.id = b.development_id
      WHERE d.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Add policy so platform admins and org_admins can also update profiles they manage
DROP POLICY IF EXISTS "Platform admins update profiles" ON public.profiles;
CREATE POLICY "Platform admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_platform_admin());
