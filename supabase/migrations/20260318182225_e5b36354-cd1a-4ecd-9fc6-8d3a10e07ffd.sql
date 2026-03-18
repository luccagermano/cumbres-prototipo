-- Add platform admin INSERT policy for sales_contracts
CREATE POLICY "Platform admins insert contracts"
ON public.sales_contracts
FOR INSERT
TO authenticated
WITH CHECK (is_platform_admin());