# Tasty Point

A full-stack restaurant QR ordering platform — customers scan a table QR code to browse the menu, add items to cart, and pay online or at the counter. Staff manage orders, menu, and tables from an admin panel with live analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/tasty-point run dev` — run the frontend (port 22677)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, Wouter routing, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Payments: Razorpay (script-loaded on checkout)
- Media: Cloudinary (image/video upload via base64)
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tasty-point/src/` — React frontend
  - `pages/menu.tsx` — Customer menu with category/veg filters + cart flyout
  - `pages/cart.tsx` — Cart review + Razorpay/cash checkout
  - `pages/order-status.tsx` — Live order tracking (polled every 5s)
  - `pages/admin-dashboard.tsx` — Stats, recent orders, best sellers
  - `pages/admin-orders.tsx` — Live order management with status updates
  - `pages/admin-menu.tsx` — Menu item CRUD + Cloudinary upload
  - `pages/admin-tables.tsx` — Table management + QR code generation/download
  - `lib/cart-store.ts` — localStorage cart with pub/sub
  - `components/AdminLayout.tsx` — Sidebar layout with mobile drawer
  - `components/FoodCard.tsx` — Menu item card with inline quantity controls
  - `components/VegBadge.tsx` — Green dot (veg) / Red triangle (non-veg)
- `artifacts/api-server/src/routes/` — Express route handlers
- `lib/db/src/schema/` — Drizzle schema (categories, menu_items, restaurant_tables, orders, order_items)
- `lib/api-spec/` — OpenAPI 3.0 spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — Generated hooks and Zod schemas

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval generates React Query hooks and Zod schemas. Never hand-write API client code.
- Cart is localStorage-only with a simple pub/sub; no server-side session needed until order placement.
- Razorpay script loaded dynamically only at checkout (not on page load) to avoid unnecessary network cost.
- Order status polling every 5s on the order-status page (acceptable for MVP; can upgrade to Supabase realtime later).
- `numeric` columns in Drizzle ORM return strings — all route handlers cast with `Number()`.

## Product

- **Customer flow**: Scan QR → browse menu (search/category/veg filter) → add to cart → checkout (Razorpay online or cash) → live order status tracking
- **Admin flow**: Dashboard analytics → live order board with one-click status updates → full menu CRUD with image/video upload → table management with downloadable QR codes

## User preferences

- No emojis in UI
- Veg = green dot badge, Non-veg = red triangle badge
- Mobile-first for customer pages (375px), desktop sidebar layout for admin
- Theme: red + white luxury (primary #C53030, Playfair Display serif headings, Inter body)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec
- Always run `pnpm --filter @workspace/db run push` after changing the DB schema
- Do not hardcode ports — use `PORT` env var (8080 for API, 22677 for frontend)
- `qrcode` package is installed in `@workspace/tasty-point` for QR generation
- Razorpay global (`window.Razorpay`) is declared in `pages/cart.tsx` — not a package import

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
