# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Ionic Vue 3 + TypeScript + Supabase** HR attendance system. Employees scan QR codes to clock in/out; admins manage attendance, approve leave/OT/correction requests, and configure master data. The app targets iOS, Android, and web via Capacitor.

## Commands

```bash
npm run dev             # Vite dev server (localhost:5173)
npm run dev:host        # Dev server bound to 127.0.0.1 (for device testing)
npm run build           # Production build to dist/
npm run preview         # Preview production build locally
npm run typecheck       # vue-tsc type check (no emit)
npm run lint            # ESLint with auto-fix
npm run format          # Prettier on src/**/*.{js,vue,css,scss}
npm run ios:live        # Capacitor live reload — iOS
npm run andriod:live    # Capacitor live reload — Android (note: typo in package.json)
npm run create:role-users  # Node script to seed test users by role
```

There is no test framework configured (no Jest/Vitest). QA is manual or via external Playwright scripts.

## Environment Setup

Copy `.env-example` to `.env` and fill in:
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...  # anon key only — never service_role
```

Types should be regenerated after schema changes:
```bash
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

## Architecture

### Auth & Role Flow

1. Login → `authService.login()` → Supabase Auth
2. App queries `public.app_users` joined to `roles`, `employees`, `departments`, `positions`
3. Auth store (`src/stores/auth.ts`) stores session + computed flags: `isAdmin`, `isHR`, `isManager`, `isEmployee`, `isAdminOrHR`
4. Router guard in `src/router/index.ts` enforces role-based access via route `meta.roles`:
   - `/employee/tabs/*` — roles: `Manager`, `Employee`
   - `/admin/tabs/*` — roles: `Admin`, `HR Manager`
5. `onAuthStateChange()` in the auth store keeps the session reactive across browser refreshes.

### Service Layer

All Supabase queries live in `src/services/`. Pages must not call `supabase` directly.

| Service | Responsibility |
|---|---|
| `authService.ts` | login, logout, loadCurrentUserContext |
| `attendanceService.ts` | QR processing via RPC `process_qr_attendance()`, attendance records/logs |
| `employeeService.ts` | Employee CRUD |
| `requestService.ts` | Leave, overtime, correction request CRUD |
| `adminService.ts` | Dashboard summary, QR locations |
| `settingsService.ts` | Settings queries |

The QR scan calls a Supabase RPC (`process_qr_attendance`) that validates the QR code, creates `attendance_logs`, and updates `attendance_records` atomically. In-browser QR scanning uses `@zxing/browser`.

### State Management

Only one Pinia store exists: `src/stores/auth.ts`. All other state is local `ref()`/`reactive()` inside components, populated by service calls on `onMounted` or `ionViewWillEnter` (prefer `ionViewWillEnter` for Ionic pages so data refreshes on back-navigation).

### Routing

Two layout shells with tab navigation:
- `EmployeeLayout.vue` — 5-tab bottom nav (home, scan, attendance, requests, profile)
- `AdminLayout.vue` — 6-tab bottom nav (dashboard, scan, employees, attendance, requests, settings)

Nested routes render inside `<ion-router-outlet>` within each layout.

### Composables

- `useToast()` — success/danger/warning toast notifications; also exposes `showErrorToast()`
- `useSupabaseError()` — extracts human-readable message from Supabase error objects
- `useLoading()` — returns `{ isLoading, withLoading }` to wrap async calls

### Reusable Components

Common components in `src/components/`:
- `AppEmptyState.vue`, `AppLoadingCard.vue` — standard empty/loading states
- `StatusBadge.vue`, `MetricCard.vue` — shared display primitives
- `RequestCard.vue`, `AttendanceCard.vue` — domain-specific list cards
- `ProfileHeader.vue`, `AppLogoutButton.vue` — auth-related UI

### Path Alias

`@/` maps to `src/` — use this in all imports.

## Key Constraints

- **Never use the Supabase `service_role` key in frontend code.** Only the `anon` (publishable) key is safe for client-side.
- Security is enforced by Supabase Row Level Security policies + RPC-level validation. Frontend role checks are a UX convenience, not a security boundary.
- `src/utils/supabase.ts` is a legacy file — use `src/lib/supabase.ts` for the typed Supabase client.
- Ionic components (`<ion-*>`) require the Ionic CSS variables from `src/theme/variables.css` to render correctly.
