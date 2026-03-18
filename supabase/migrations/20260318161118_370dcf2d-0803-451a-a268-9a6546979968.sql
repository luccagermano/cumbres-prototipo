
-- Enum
CREATE TYPE public.app_role AS ENUM (
  'customer',
  'org_admin',
  'finance_agent',
  'support_agent',
  'inspection_agent',
  'document_agent',
  'executive_viewer'
);

-- 1) organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  legal_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone_e164 TEXT,
  cpf_last4 TEXT,
  avatar_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) organization_memberships
CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, role)
);

-- 4) developments
CREATE TABLE public.developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address_line TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  launch_status TEXT,
  delivery_forecast_at TIMESTAMPTZ,
  total_units INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- 5) blocks
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (development_id, name)
);

-- 6) units
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  floor_label TEXT,
  typology TEXT,
  private_area_m2 NUMERIC(10,2),
  bedrooms INT,
  bathrooms INT,
  parking_spots INT,
  commercial_status TEXT,
  handed_over_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_id, code)
);

-- 7) unit_memberships
CREATE TABLE public.unit_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unit_id, user_id)
);

-- Indexes on foreign keys and common query fields
CREATE INDEX idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_developments_org ON public.developments(organization_id);
CREATE INDEX idx_blocks_dev ON public.blocks(development_id);
CREATE INDEX idx_units_block ON public.units(block_id);
CREATE INDEX idx_unit_memberships_user ON public.unit_memberships(user_id);
CREATE INDEX idx_unit_memberships_unit ON public.unit_memberships(unit_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_developments_slug ON public.developments(slug);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_memberships ENABLE ROW LEVEL SECURITY;

-- has_role helper (security definer, no RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = _user_id AND role = _role AND active = true
  );
$$;

-- Profile: users read/update own
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Org memberships: users see own
CREATE POLICY "Users read own memberships" ON public.organization_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Org admins see all in org
CREATE POLICY "Org admins read org memberships" ON public.organization_memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'org_admin') AND organization_id IN (
    SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid() AND active = true
  ));

-- Organizations: members can read their org
CREATE POLICY "Members read own org" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid() AND active = true));

-- Developments: public read for launched, members read all in their org
CREATE POLICY "Public read developments" ON public.developments FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read developments" ON public.developments FOR SELECT TO authenticated USING (true);

-- Blocks: readable if development is readable
CREATE POLICY "Public read blocks" ON public.blocks FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read blocks" ON public.blocks FOR SELECT TO authenticated USING (true);

-- Units: members of the org can read
CREATE POLICY "Org members read units" ON public.units FOR SELECT TO authenticated
  USING (block_id IN (
    SELECT b.id FROM public.blocks b
    JOIN public.developments d ON d.id = b.development_id
    JOIN public.organization_memberships om ON om.organization_id = d.organization_id
    WHERE om.user_id = auth.uid() AND om.active = true
  ));

-- Unit memberships: users see own
CREATE POLICY "Users read own unit memberships" ON public.unit_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_developments_updated_at BEFORE UPDATE ON public.developments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
