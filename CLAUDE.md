# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15 full-stack analytics dashboard** that analyzes advertising burst protection effectiveness by querying a **Vertica database**. The application visualizes campaign performance metrics, budget depletion rates, spending spikes, and blocking activity.

**Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- Backend: Next.js API Routes (Node.js runtime)
- Database: Vertica (via custom connection pool with `generic-pool`)
- State Management: TanStack Query for server state + URL-based filter state
- UI Components: Radix UI primitives (shadcn/ui pattern)
- Animations: Framer Motion + CSS transitions
- Validation: Zod schemas
- Package Manager: **pnpm** (always use pnpm, never npm or yarn)

## Quick Start for Developers

### Setup Script
Use the automated setup script for quickest onboarding:
```bash
./setup.sh
```

This handles: Node.js check, pnpm installation, dependencies, Vertica configuration, build, and run.

### Manual Setup
```bash
# Install dependencies
pnpm install

# Configure Vertica credentials
cp .env.docker.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev

# Open http://localhost:3000
```

## Development Commands

```bash
# Development server (uses Turbopack)
pnpm dev

# Build for production (uses Turbopack)
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

Development server runs on `http://localhost:3000`

## Architecture Overview

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API Routes
│   │   ├── burst-protection/     # Main data endpoints
│   │   │   ├── route.ts          # GET burst protection data
│   │   │   ├── metrics/route.ts  # GET aggregated metrics
│   │   │   ├── advertisers/route.ts
│   │   │   └── campaigns/route.ts
│   │   ├── test-db/route.ts      # Database health check
│   │   └── pool-stats/route.ts   # Connection pool monitoring
│   ├── page.tsx                  # Main dashboard page
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   ├── charts/                   # Recharts visualizations
│   ├── filters/                  # Filter UI components
│   └── ui/                       # Radix UI primitives (shadcn/ui)
│
├── lib/                          # Business logic & utilities
│   ├── db/                       # Database layer
│   │   ├── vertica.ts           # Connection pool (SINGLETON)
│   │   ├── queries.ts           # SQL query builders
│   │   ├── schema.ts            # Zod validation schemas
│   │   └── types.ts             # TypeScript types
│   ├── analytics/               # Data processing
│   │   ├── aggregators.ts       # Daily/account aggregations
│   │   └── calculators.ts       # KPI calculations
│   ├── hooks/                   # Custom React hooks
│   ├── cache.ts                 # In-memory cache (node-cache)
│   └── query-client.ts          # TanStack Query config
│
└── types/                        # TypeScript type definitions
```

### Data Flow

**Frontend → Backend:**
```
page.tsx
  → useFilters() (URL state management)
  → useBurstProtectionData() / useMetrics() (TanStack Query)
  → API Routes (/api/burst-protection/*)
  → Vertica Connection Pool
  → SQL queries with CTEs
  → Zod validation
  → Cache (5 min TTL)
  → JSON response
```

## Key Patterns & Conventions

### Database Connection Pool

The Vertica connection pool (`src/lib/db/vertica.ts`) is a **singleton with HMR support**:
- Uses `global` variables to persist across Hot Module Reloads in development
- Pool config: min=1, max=10 connections
- Retry logic: 3 attempts with exponential backoff
- Query timeout: 120 seconds
- Always use `VerticaConnectionPool.query()` - never create direct connections

**Critical:** The pool is initialized once and reused. Never call `new Pool()` elsewhere.

### API Route Standards

All API routes follow this pattern:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Parse & validate query params (Zod)
  // 2. Check cache
  // 3. Query database via VerticaConnectionPool
  // 4. Validate rows (Zod)
  // 5. Cache result (300s TTL)
  // 6. Return JSON: { data, metadata, success, cached }
}
```

### Caching Strategy

Two-layer caching:
1. **Server-side:** node-cache in API routes (5 min TTL)
2. **Client-side:** TanStack Query (5 min stale time)

Bypass cache with `?nocache=true` query parameter.

### Type Safety

- All database rows validated with Zod schemas at runtime
- TypeScript types derived from Zod schemas using `z.infer<>`
- API responses typed in `src/types/api.ts`

### SQL Queries

Queries use **CTEs (Common Table Expressions)** for performance:
- Complex joins pushed to database (Vertica) rather than Node.js
- Query builder functions in `src/lib/db/queries.ts`
- Never use string interpolation - always use parameterized queries

### Custom Hooks

- `useFilters()` - Filter state + URL synchronization
- `useBurstProtectionData()` - Main data fetching
- `useMetrics()` - Aggregated metrics fetching
- `useAdvertisers()` - Advertiser dropdown data
- `useCampaigns()` - Campaign dropdown data (filtered by advertiser)

All hooks use TanStack Query internally.

### UI Components

Following shadcn/ui pattern:
- Radix UI primitives wrapped with Tailwind CSS
- Components in `src/components/ui/`
- Use `cn()` utility from `src/lib/utils.ts` for class merging

## Environment Variables

Required in `.env.local`:
```
VERTICA_HOST=office-vrt.taboolasyndication.com
VERTICA_PORT=5433
VERTICA_DATABASE=taboola_prod
VERTICA_USER=<username>
VERTICA_PASSWORD=<password>
```

## Common Development Workflows

### Adding a New Metric

1. Update SQL query in `src/lib/db/queries.ts`
2. Update Zod schema in `src/lib/db/schema.ts`
3. Update TypeScript type in `src/lib/db/types.ts`
4. Add calculation logic in `src/lib/analytics/calculators.ts`
5. Update API response in `src/app/api/burst-protection/metrics/route.ts`
6. Update frontend hook in `src/lib/hooks/`
7. Add visualization component in `src/components/charts/`

### Adding a New Filter

1. Update filter state type in `src/types/filters.ts`
2. Add filter component in `src/components/filters/`
3. Update `useFilters()` hook in `src/lib/hooks/`
4. Update SQL WHERE clause in `src/lib/db/queries.ts`
5. Update API route parameter parsing

### Debugging Database Connections

Use these endpoints:
- `/api/test-db` - Database health check
- `/api/pool-stats` - Connection pool statistics (size, available, pending)

## Important Notes

- **Never use npm or yarn** - this project uses pnpm exclusively
- **Database credentials** are sensitive - never commit `.env.local`
- **Connection pool** is a singleton - never create new pools
- **HMR caveat:** In development, the global pool persists across reloads
- **Query performance:** Complex aggregations happen in Vertica (CTEs), not Node.js
- **Feature date:** The dashboard measures impact before/after burst protection enablement
- **URL state:** Filters are synchronized with URL query params for shareable links

## Monitoring & Debugging

- Check browser DevTools → Network tab for API response times
- Monitor cache hit rates in API responses (`cached: true/false`)
- Use `/api/pool-stats` to diagnose connection pool issues
- TanStack Query DevTools available in development mode

## Database Schema Notes

Main table columns:
- `description` - Advertiser name
- `advertiser_id` - Advertiser ID
- `data_timestamp_by_request_time` - Data timestamp
- `feature_date` - When burst protection was enabled
- `avg_depletion_rate` - Average budget depletion rate
- `mac_avg` - MAX_CONVERSIONS average
- `spikes_count` - Number of spending spikes detected
- `amount_of_blocking` - Amount of budget blocked
- `blocking_status` - 'BLOCKED' | 'NOT BLOCKED'

The application supports hierarchical filtering: Advertiser → Campaign

## Project Documentation

Comprehensive documentation available:
- **[README.md](./README.md)** - Quick start, setup, and usage guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed technical architecture
- **[electronPlan.md](./electronPlan.md)** - Electron desktop app migration plan
- **[uiPlan.md](./uiPlan.md)** - UI/UX enhancement roadmap
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Recent improvements

## Setup Script

The automated setup script (`./setup.sh`) provides:
- Node.js version check (v20+ required)
- Automatic pnpm installation
- Dependency installation
- Interactive Vertica credential configuration
- Database connection testing
- Build and run options

**Usage:**
```bash
./setup.sh                  # Full setup
./setup.sh --config-only    # Only configure .env.local
./setup.sh --test-connection # Test existing config
./setup.sh --help           # Show options
```

## Key Files to Know

### Database Layer
- `src/lib/db/vertica.ts` - Connection pool (singleton, HMR-aware)
- `src/lib/db/queries.ts` - SQL query builders
- `src/lib/db/schema.ts` - Zod validation schemas
- `src/lib/db/types.ts` - TypeScript types

### API Routes
- `src/app/api/burst-protection/route.ts` - Main data endpoint
- `src/app/api/burst-protection/metrics/route.ts` - Aggregated metrics
- `src/app/api/test-db/route.ts` - Health check
- `src/app/api/pool-stats/route.ts` - Pool monitoring

### Frontend Components
- `src/app/page.tsx` - Main dashboard page (Server Component)
- `src/components/dashboard/DashboardLayout.tsx` - Layout wrapper
- `src/components/dashboard/MetricsCards.tsx` - KPI cards
- `src/components/charts/` - Recharts visualizations
- `src/lib/hooks/useFilters.ts` - URL state management

### Styling & Design
- `src/app/globals.css` - Global styles + design system
- `src/lib/design-tokens.ts` - Design tokens (spacing, colors, gradients)
- `src/lib/utils/color.ts` - Chart color utilities
- `src/components/ui/` - Radix UI primitives (shadcn/ui)

## Testing Checklist

When making changes:
- [ ] Test with various filter combinations
- [ ] Verify URL state updates correctly
- [ ] Check cache behavior (hit/miss)
- [ ] Monitor connection pool stats
- [ ] Test error handling (network failures)
- [ ] Verify animations and transitions
- [ ] Check mobile responsiveness
- [ ] Test with no data / edge cases
- [ ] Validate Zod schemas catch bad data
- [ ] Run `pnpm build` to ensure production build works
