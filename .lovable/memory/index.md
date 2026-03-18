Brazilian construction company multi-area platform. Glassmorphism design, green palette (#7fbf4f, #276233, #348846), Space Grotesk + Inter fonts.

## Design System
- Glass cards: `glass-card`, `glass-panel` classes in index.css
- Brand colors: brand-50 through brand-700 in tailwind config
- Gradient text: `gradient-text` class
- All CSS colors in HSL
- Custom primitives: GlassCard, KpiCard, StatusChip, Timeline, DataTable, ChipFilter, SearchBar, UploadArea, NotificationItem, DocumentRow, TicketRow, CalendarGrid, ChatLayout, PageHeader, ModalShell, DrawerShell
- StatusChip variants: success, warning, error, info, neutral, pending (NOT "default")
- ChipFilter expects { label, value }[] and selected: string[]

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

## Database Schema
- Group 1: organizations, profiles, organization_memberships, developments, blocks, units, unit_memberships
- Group 2: sales_contracts, journey_events, receivables, payments
- Group 3: documents, faq_categories, faq_articles, notifications, leads
- Group 4: warranty_rules, calendar_custom_events, inspection_types, inspection_slots, inspection_bookings, inspection_report_items, tickets, ticket_messages, service_catalog, service_requests
- Group 5: knowledge_sources, knowledge_chunks, audit_events
- Enum: app_role (customer, org_admin, finance_agent, support_agent, inspection_agent, document_agent, executive_viewer)
- Security definer functions: has_role(), get_user_org_ids()
- Auto-create profile trigger on auth.users insert
- Storage buckets: documents-private, avatars-private (both private)

## Rules
- All UI copy in Brazilian Portuguese
- No mock data, localStorage, or fake APIs
- Supabase for auth, database, storage
- Desktop-first, mobile-ready
