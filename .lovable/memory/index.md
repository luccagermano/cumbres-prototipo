Brazilian construction company multi-area platform. Glassmorphism design, green palette (#7fbf4f, #276233, #348846), Space Grotesk + Inter fonts.

## Design System
- Glass cards: `glass-card`, `glass-panel` classes in index.css
- Brand colors: brand-50 through brand-700 in tailwind config
- Gradient text: `gradient-text` class
- All CSS colors in HSL
- Custom primitives: GlassCard, KpiCard, StatusChip, Timeline, DataTable, ChipFilter, SearchBar, UploadArea, NotificationItem, DocumentRow, TicketRow, CalendarGrid, ChatLayout, PageHeader, ModalShell

## Route Structure
- Public: /site, /site/sobre, /site/contato, /empreendimentos/*, /campanha/:slug (PublicLayout)
- Customer: /cliente/* 12 routes (CustomerLayout w/ sidebar + mobile bottom nav + WhatsApp) — ProtectedRoute (any auth)
- Internal: /interno/* 7 routes (InternalLayout w/ left sidebar) — ProtectedRoute (staff roles)
- Executive: /executivo, /executivo/automacao (ExecutiveLayout w/ left sidebar) — ProtectedRoute (org_admin, executive_viewer)
- Docs: /documentacao (standalone w/ GlobalAreaSwitcher)
- Auth: /login, /register (standalone)

## Architecture
- AuthProvider context wraps all routes inside BrowserRouter
- ProtectedRoute component with optional allowedRoles prop
- GlobalAreaSwitcher: top bar, shows profile name + logout when authenticated
- CustomerLayout: desktop sidebar + mobile bottom nav + WhatsApp FAB
- EmptyState: shared component for empty data states

## Database Schema (Group 1)
- Enum: app_role (customer, org_admin, finance_agent, support_agent, inspection_agent, document_agent, executive_viewer)
- Tables: organizations, profiles, organization_memberships, developments, blocks, units, unit_memberships
- has_role() security definer function for RLS
- Auto-create profile trigger on auth.users insert
- update_updated_at() trigger on orgs, profiles, developments, units
- RLS enabled on all tables

## Rules
- All UI copy in Brazilian Portuguese
- No mock data, localStorage, or fake APIs
- Supabase for auth, database, storage
- Desktop-first, mobile-ready
