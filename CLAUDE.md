# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Umami is a privacy-focused web analytics platform (alternative to Google Analytics) built with Next.js 15, React 19, TypeScript, and PostgreSQL/Prisma. The project emphasizes data ownership, GDPR compliance, and simplicity.

**Key Technologies:**
- Next.js 15.5.3 (App Router)
- React 19.2.0
- TypeScript 5.9.3
- Prisma 6.18.0 (PostgreSQL)
- pnpm (package manager)
- TanStack React Query 5.90.5
- Zustand 5.0.8 (state management)
- react-intl 7.1.14 (i18n, 40+ languages)

## Development Commands

```bash
# Initial setup
pnpm install
cp .env.example .env  # Configure DATABASE_URL

# Development
pnpm run dev          # Start dev server on http://localhost:3001

# Building
pnpm run build        # Full build: DB + tracker + geo + Next.js
pnpm run build-app    # Build Next.js only (with Turbo)
pnpm run build-tracker # Build analytics tracking script
pnpm run build-db     # Generate Prisma client
pnpm run build-geo    # Build geolocation database

# Database
pnpm run update-db    # Run Prisma migrations
pnpm run check-db     # Verify database connection

# Code quality
pnpm run lint         # ESLint
pnpm run test         # Jest unit tests
pnpm run cypress-run  # E2E tests

# Production
pnpm run start        # Start production server

# Docker
docker compose up -d  # Start PostgreSQL + Umami
```

**Default credentials after first build:** username `admin`, password `umami`

## Architecture Overview

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (main)/              # Protected routes (authenticated users)
│   │   ├── links/           # Link tracking management
│   │   ├── pixels/          # Pixel tracking management
│   │   ├── websites/        # Website analytics
│   │   ├── teams/           # Team management
│   │   ├── admin/           # Admin panel
│   │   └── settings/        # User settings
│   ├── (collect)/           # Data collection endpoints
│   │   ├── p/[slug]/        # Pixel tracking endpoint
│   │   └── q/[slug]/        # Link tracking endpoint
│   ├── api/                 # REST API (75+ endpoints)
│   ├── login/               # Login page
│   └── share/               # Public shared reports
│
├── components/              # React components
│   ├── hooks/              # Custom hooks (30+)
│   ├── common/             # Reusable UI components
│   └── messages.ts         # All UI strings (i18n keys)
│
├── lib/                    # Utilities (35+ files)
│   ├── auth.ts            # Authentication & JWT
│   ├── prisma.ts          # Prisma client wrapper
│   ├── request.ts         # Request parsing & validation
│   └── db.ts              # Database type detection
│
├── queries/                # Database query layer
│   ├── prisma/            # Prisma ORM queries (CRUD)
│   └── sql/               # Raw SQL (analytics aggregations)
│
├── permissions/            # Role-based access control
├── store/                  # Zustand global state
├── tracker/                # Analytics tracker script
├── middleware.ts           # Next.js middleware (URL routing)
└── lang/                   # i18n source files

prisma/
├── schema.prisma           # 14 models, complete data schema
└── migrations/             # Database migrations
```

### Key Architectural Patterns

1. **Next.js App Router with Route Groups**
   - `(main)` - Authenticated routes, not in URL path
   - `(collect)` - Hidden collection endpoints
   - Route groups provide logical organization without affecting URLs

2. **Dual Query Layer**
   - **Prisma queries** (`src/queries/prisma/`) - Simple CRUD operations
   - **Raw SQL** (`src/queries/sql/`) - Complex analytics with aggregations
   - Conditional execution based on `DATABASE_TYPE` environment variable

3. **Middleware-based URL Routing**
   - `src/middleware.ts` redirects short URLs like `/abc123` to `/q/abc123`
   - Excludes known app routes to prevent conflicts
   - Uses 307 redirect for link tracking compatibility

4. **Permission System**
   - Resource-level permissions in `src/permissions/`
   - Role-based access: User, Team Admin, System Admin
   - `checkAuth()` middleware validates JWT on all API requests

5. **State Management Strategy**
   - **Zustand** - Simple global state (user, theme, filters)
   - **React Query** - Server state, caching, refetching
   - **React Context** - i18n, component coordination

## Database Schema (Prisma)

**14 Core Models:**
- `User` - System users with roles
- `Session` - Analytics sessions (browser, OS, device, location)
- `Website` - Tracked websites
- `WebsiteEvent` - Pageviews and custom events
- `EventData` - Custom event properties
- `SessionData` - Session-specific data
- `Team` - Organization grouping
- `TeamUser` - Team membership
- `Report` - Saved analytics reports
- `Segment` - User-defined segments
- `Revenue` - Revenue tracking
- `Link` - Link shortener entities
- `Pixel` - Pixel tracking entities

**Important patterns:**
- All IDs are UUIDs
- Snake_case column naming (`user_id`, `created_at`)
- Soft deletes via `deletedAt` column
- Composite indexes for performance
- Timezone-aware timestamps (`timestamptz`)

## API Structure

**Authentication:**
- JWT tokens stored in HTTP-only cookies
- `Authorization: Bearer <token>` header
- `checkAuth()` middleware validates all API requests

**Common API patterns:**
```typescript
// All routes follow this structure:
1. parseRequest(request, zodSchema) - Validate input
2. checkAuth() - Verify JWT token
3. can[Action][Resource](auth, resourceId) - Check permissions
4. Query database via Prisma or SQL
5. Return json() response
```

**Key endpoints:**
- `/api/send` - Analytics data collection
- `/api/auth/login` - User login
- `/api/websites/[id]/stats` - Website analytics
- `/api/realtime/[id]` - Real-time visitor stream
- `/api/links` - Link tracking CRUD
- `/api/pixels` - Pixel tracking CRUD

## Data Collection Flow

1. **Tracker script** (`public/script.js`) installed on customer websites
2. Script collects pageviews/events → `POST /api/send`
3. Server extracts IP, user agent, device info, geolocation
4. Creates `Session` and `WebsiteEvent` records
5. Optional: Send to ClickHouse or Kafka for real-time processing
6. Dashboard queries aggregate events via `/api/websites/[id]/stats`

## Code Style & Patterns

### TypeScript Usage
- Strict TypeScript throughout
- Zod for runtime validation
- Prisma generates types automatically
- Type aliases in `src/lib/types.ts`

### Component Patterns
- Hooks-first approach (30+ custom hooks in `src/components/hooks/`)
- Composition over inheritance
- Extract components when logic gets complex (avoid inline `useEffect` in render functions)
- CSS Modules for component styles (`.module.css`)

### Database Queries
- Use Prisma for simple CRUD operations
- Use raw SQL for analytics with aggregations
- Always use parameterized queries to prevent SQL injection
- Include proper indexes in schema for filtered columns

### API Routes
- Always validate input with Zod schemas
- Check authentication and permissions
- Return typed JSON responses
- Handle errors gracefully with proper status codes

### Frontend State
- Use Zustand for simple global state
- Use React Query for server data (automatic caching, refetching)
- Avoid prop drilling - use context or Zustand

## Important Files

| File | Purpose |
|------|---------|
| `next.config.ts` | CSP, CORS, rewrites, output mode |
| `src/middleware.ts` | Short URL routing logic |
| `prisma/schema.prisma` | Complete database schema |
| `src/lib/auth.ts` | Authentication logic |
| `src/lib/prisma.ts` | Prisma client & utilities |
| `src/components/messages.ts` | All UI text (i18n) |
| `src/tracker/index.js` | Client-side analytics tracker |
| `rollup.tracker.config.js` | Tracker bundling config |

## Testing

- **Unit tests**: Jest, located in `src/lib/__tests__/`
- **E2E tests**: Cypress, located in `cypress/`
- Run tests before committing changes

## Environment Variables

```bash
DATABASE_URL=postgresql://...     # PostgreSQL connection
DATABASE_TYPE=postgresql          # postgresql, clickhouse
APP_SECRET=random-secret          # JWT signing secret
BASE_PATH=/analytics              # URL prefix (optional)
CLICKHOUSE_URL=...                # Optional: ClickHouse integration
KAFKA_BROKERS=...                 # Optional: Kafka brokers
REDIS_URL=...                     # Optional: Redis caching
```

## Common Tasks

### Adding a new API endpoint
1. Create route in `src/app/api/[feature]/route.ts`
2. Define Zod schema for validation
3. Use `parseRequest()` for input parsing
4. Use `checkAuth()` for authentication
5. Check permissions with `can[Action][Resource]()`
6. Query database via `src/queries/prisma/` or SQL
7. Return `json()` response

### Adding a new database model
1. Update `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name description`
3. Add queries in `src/queries/prisma/[model].ts`
4. Export queries in `src/queries/prisma/index.ts`
5. Add permissions in `src/permissions/[model].ts`

### Adding i18n text
1. Add key to `src/components/messages.ts`
2. Run `pnpm run generate-lang` to extract messages
3. Translate in language files (`src/lang/[locale].json`)
4. Run `pnpm run build-lang` to compile

### Modifying slug validation
- API validation: `src/app/api/links/route.ts` and `src/app/api/links/[linkId]/route.ts`
- Current rules: `z.string().min(1).max(100)`
- Frontend form: `src/app/(main)/links/LinkEditForm.tsx`

## Deployment

**Docker:**
```bash
docker compose up -d            # Local development
docker pull docker.umami.is/umami-software/umami:postgresql-latest
```

**Environment setup:**
1. Set `DATABASE_URL` to PostgreSQL connection string
2. Set `APP_SECRET` to random string (for JWT signing)
3. Run `pnpm run build` (creates admin user on first run)
4. Run `pnpm run start`

**Health check:** `GET /api/heartbeat`

## Git Workflow

- Pre-commit hooks via Husky + lint-staged
- Automatic linting and formatting on commit
- ESLint + Prettier enforce code style
- Run `pnpm run lint` before pushing

## Recent Modifications (Fork-specific)

This fork includes the following customizations:

1. **GitHub Actions** - Modified `.github/workflows/cd-cloud.yml` to build `ghcr.io` images (latest only)

2. **Link Slug Customization**
   - Slug field is now editable in `LinkEditForm.tsx`
   - Minimum slug length reduced from 8 to 1 character
   - Supports short slugs like `251`, `a`, `abc`

3. **Short URL Compatibility**
   - Middleware redirects `/xxx` → `/q/xxx` for backward compatibility
   - Supports legacy short link servers without `/q/` prefix

4. **Language Files**
   - Added `label.slug` to `src/lang/en-US.json` and `src/lang/zh-CN.json`

**When modifying these features, ensure:**
- Slug validation remains consistent across API routes
- Middleware excludes app routes to prevent conflicts
- Form state synchronization works correctly with React Hook rules
