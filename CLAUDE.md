# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Ionic Vue 3 + TypeScript + Supabase** HR attendance system. Employees scan QR codes to clock in/out; admins manage attendance, approve leave/OT/correction requests, and configure master data. The app targets iOS, Android, and web via Capacitor.

## Commands

```bash
npm run dev             # Vite dev server (localhost:5173)
npm run dev:host        # Dev server bound to 127.0.0.1 (for device testing)
npm run build           # Production build to dist/
npm run typecheck       # vue-tsc type check (no emit)
npm run lint            # ESLint with auto-fix
npm run format          # Prettier on src/**/*.{js,vue,css,scss}
npm run ios:live        # Capacitor live reload — iOS
npm run andriod:live    # Capacitor live reload — Android
```

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
4. Router guard in `src/router/index.ts` enforces role-based access:
   - `/employee/tabs/*` — roles: `Manager`, `Employee`
   - `/admin/tabs/*` — roles: `Admin`, `HR Manager`

### Service Layer

All Supabase queries live in `src/services/`. Pages should not call `supabase` directly.

| Service | Responsibility |
|---|---|
| `authService.ts` | login, logout, loadCurrentUserContext |
| `attendanceService.ts` | QR processing via RPC `process_qr_attendance()`, attendance records/logs |
| `employeeService.ts` | Employee CRUD |
| `requestService.ts` | Leave, overtime, correction request CRUD |
| `adminService.ts` | Dashboard summary, QR locations |
| `settingsService.ts` | Settings queries |

The QR scan calls a Supabase RPC (`process_qr_attendance`) that validates the QR code, creates `attendance_logs`, and updates `attendance_records` atomically.

### State Management

Only one Pinia store exists: `src/stores/auth.ts`. All other state is local `ref()`/`reactive()` inside components, populated by direct service calls on `onMounted` / `ionViewWillEnter`.

### Routing

Two layout shells with tab navigation:
- `EmployeeLayout.vue` — 5-tab bottom nav (home, scan, attendance, requests, profile)
- `AdminLayout.vue` — admin tab layout

### Composables

- `useToast()` — success/danger/warning toast notifications
- `useSupabaseError()` — extracts human-readable message from Supabase error objects
- `useLoading()` — loading state helper

### Path Alias

`@/` maps to `src/` — use this in all imports.

## Key Constraints

- **Never use the Supabase `service_role` key in frontend code.** Only the `anon` (publishable) key is safe for client-side.
- Security is enforced by Supabase Row Level Security policies + RPC-level validation. Frontend role checks are a UX convenience, not a security boundary.
- `src/utils/supabase.ts` is a legacy file — use `src/lib/supabase.ts` for the typed Supabase client.
- Ionic components (`<ion-*>`) require the Ionic CSS variables from `src/theme/variables.css` to render correctly.
