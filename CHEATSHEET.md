# Odoo Demo Project Cheat Sheet

## Project Overview

- Framework: Vue 3 + Ionic Vue
- State management: Pinia
- Build tool: Vite
- Native wrappers: Capacitor (Android + iOS)
- Backend: Odoo JSON-RPC API
- Main purpose: leave/attendance management app with login, leave request, attendance, and admin approval flows

## Key Project Files

- `package.json` - scripts, dependencies, dev dependencies
- `vite.config.js` - Vite project config
- `src/main.js` - App bootstrap, Ionic + Pinia + router setup
- `src/router/index.js` - Routes, auth guard, tab layout
- `src/App.vue` - App root component
- `src/api/` - API layer and network helpers
- `src/stores/` - Pinia stores
- `src/views/` - Page screens
- `src/components/` - Reusable components and modals
- `src/theme/variables.css` - Ionic theme variables
- `android/`, `ios/` - Capacitor native Android and iOS wrappers

## Packages & Dependencies

- `dependencies` are required at runtime in the built app. These packages ship with the app or are used while the app is running in development and production.
- `devDependencies` are only required while developing, building, linting, or testing the app. They are not shipped in the production bundle.

### Runtime

- `@ionic/vue`, `@ionic/vue-router` — Ionic UI framework for Vue and the Ionic router integration.
- `@capacitor/core` — Capacitor runtime core for native platform features.
- `@capacitor/android`, `@capacitor/ios` — native platform support packages for Android and iOS builds.
- `@capacitor/app` — app lifecycle events and native app controls.
- `@capacitor/keyboard` — keyboard show/hide handling on mobile.
- `@capacitor/preferences` — cross-platform persistent storage for session data.
- `@capacitor/status-bar` — control the native status bar appearance.
- `@capacitor/haptics` — haptic feedback/vibration support.
- `vue` — the main frontend framework.
- `vue-router` — client-side routing for Vue pages.
- `pinia` — state management library used by the app.
- `axios` — HTTP client used for backend API requests.
- `ionicons` — icon set used by Ionic components.

### Dev

- `vite` — development server and build tool.
- `@vitejs/plugin-vue` — Vue support for Vite.
- `@vitejs/plugin-legacy` — adds support for older browsers if needed.
- `@capacitor/cli` — Capacitor command-line tooling for native builds.
- `eslint` — JavaScript linting and code quality checks.
- `eslint-plugin-vue` — Vue-specific linting rules for ESLint.
- `cypress` — end-to-end testing framework.
- `vitest` — unit and integration test runner.
- `@vue/test-utils` — Vue component testing utilities.

## CLI / NPM Scripts

From project root:

- `npm run dev` - start Vite local dev server
- `npm run dev:host` - start Vite on `127.0.0.1:5173` with strict port
- `npm run build` - build production app bundle
- `npm run preview` - preview built output locally
- `npm run andriod:live` - run Android Capacitor app with live reload
- `npm run ios:live` - run iOS Capacitor app with live reload

## App Routing

`src/router/index.js` config:

- `/login` - login screen
- `/tabs/leave-calendar` - leave calendar page (default)
- `/tabs/tab1` - leave types page
- `/tabs/tab3` - profile page
- `/tabs/tab4` - request list page
- `/tabs/leave-balance` - leave balance page
- `/tabs/admin-attendance` - admin attendance page
- `/tabs/my-attendance` - my attendance page
- `/tabs/leave-approval` - leave approval page

## Pages / Views

- `src/views/LoginPage.vue`
- `src/views/LeaveTypesPage.vue`
- `src/views/ProfilePage.vue`
- `src/views/RequestListPage.vue`
- `src/views/LeaveBalancePage.vue`
- `src/views/LeaveCalendarPage.vue`
- `src/views/AdminAttendancePage.vue`
- `src/views/MyAttendancePage.vue`
- `src/views/LeaveApprovalPage.vue`
- `src/views/TabsPage.vue`

## Store Structure

### `src/stores/auth.store.js`

- handles login/logout and session persistence
- stores `isAuthenticated`, `username`, `userId`
- hydrates session from Capacitor Preferences or browser localStorage

### `src/stores/timeoff.store.js`

- manages leave request data, leave types, catalogs, allocations, and calendar data
- actions include: `fetchLeaveRequests`, `fetchLeaveTypes`, `createLeaveType`, `saveLeaveRequest`, `approveLeaveRequest`, `refuseLeaveRequest`, `fetchCalendarData`

### `src/stores/user.store.js`

- manages employee and attendance data
- actions include: `fetchCurrentEmployee`, `fetchEmployees`, `fetchMyAttendances`, `fetchAllAttendances`, `fetchAttendanceDetail`, `toggleAttendance`, `fetchManagerAccess`

## API Layer

### Base config

- `src/api/axios.js`
  - `ODOO_BASE_URL = "https://mrp.staging-sourceamax.asia"`
  - `WEB_PROXY_BASE = "/odoo-api"`
  - `odooAxios` uses `withCredentials: true`

### Auth API

- `src/api/auth.api.js`
  - session persistence via Capacitor Preferences + browser localStorage fallback
  - login endpoint: `/web/session/authenticate`
  - logout endpoint: `/web/session/destroy`
  - handles Odoo session expiration and redirect to `/login`

### Timeoff API

- `src/api/timeoff.api.js`
  - leave list: `/web/dataset/call_kw/hr.leave/web_search_read`
  - leave save: `/web/dataset/call_kw/hr.leave/web_save`
  - approve/refuse: `/web/dataset/call_button/hr.leave/action_approve`, `/web/dataset/call_button/hr.leave/action_refuse`
  - leave type CRUD via Odoo dataset endpoints

### User API

- `src/api/user.api.js`
  - current employee info
  - employee list
  - my attendances and all attendances
  - attendance detail and toggle attendance state
  - manager access check

## Important Concepts

- Auth guard redirects unauthenticated users to `/login`
- Guest users cannot access `/tabs/*`
- Native platforms use Capacitor HTTP + Preferences
- Browser dev uses proxy path `/odoo-api` for Odoo backend requests
- Session storage is synchronized between Capacitor Preferences and browser `localStorage`

## Useful Files for Changes

- UI and page layout: `src/views/*`, `src/components/*`
- App config and theme: `src/App.vue`, `src/theme/variables.css`
- Global app bootstrap: `src/main.js`
- Router and auth rules: `src/router/index.js`
- Pinia state: `src/stores/*.js`
- Odoo endpoint naming and payloads: `src/api/*.js`

## Notes

- The app uses Ionic tabs and nested routes inside `TabsPage.vue`
- Android/iOS live reload is configured via Capacitor commands in `package.json`
- If you need environment changes, update `src/api/axios.js` or add `.env` support around `ODOO_BASE_URL`
