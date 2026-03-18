
-- Fix: restrict platform_admins SELECT to only own row or existing platform admins
DROP POLICY "Platform admins read platform_admins" ON public.platform_admins;
CREATE POLICY "Users read own platform_admin status"
  ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());
