# TODO.md — HR QR Attendance App Development Guide

This file is a step-by-step development plan for an **Ionic Vue + Supabase HR QR Attendance Scanning App**.

The goal is that you can follow this file from top to bottom and build the project without guessing the next step.

---

## 0. Project Goal

Build an HR attendance system where:

```text
Employee logs in with Supabase Auth
↓
System loads employee profile and role from app_users
↓
Employee scans QR code for check-in/check-out
↓
Supabase validates QR code
↓
Supabase inserts attendance_logs
↓
Supabase creates/updates attendance_records
↓
Admin/HR can monitor attendance, leave, overtime, and correction requests
```

---

## 1. Core Development Rules

Follow these rules during development:

- Do **not** use `service_role` key in the Ionic Vue frontend.
- Use only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase Auth handles login and password.
- `public.app_users` stores app role and profile link.
- `public.employees` stores employee information.
- QR attendance calculation should be done by Supabase SQL/RPC function, not only in frontend.
- Frontend should not trust user role from local storage only.
- Always load role from Supabase after login.
- Use RLS policies to protect data.
- Build one feature at a time and test after each feature.

---

## 2. Recommended Tech Stack

```text
Frontend: Ionic Vue + Vue 3 + TypeScript
Backend: Supabase
Database: PostgreSQL from Supabase
Authentication: Supabase Auth
Security: Row Level Security Policies
QR Scanner: Capacitor QR / Barcode scanner plugin
State Management: Pinia
Routing: Vue Router
```

---

## 3. Required Main Tables

The project database should include these tables:

```text
roles
app_users
employees
departments
positions
working_schedules
employee_schedules
qr_locations
attendance_records
attendance_logs
leave_types
leave_requests
overtime_requests
attendance_corrections
notifications
audit_logs
public_holidays
```

Important relationship:

```text
auth.users.id
    ↓
public.app_users.auth_user_id
    ↓
public.app_users.employee_id
    ↓
public.employees.id
```

---

## 4. Phase 1 — Supabase Database Setup

### [x] Step 1.1 — Create or open Supabase project

Go to Supabase Dashboard and create/open your project.

Prepare:

```text
Project URL
Publishable key
Project ref
```

You will use them later in `.env` and CLI commands.

---

### [x] Step 1.2 — Run complete SQL file

Run the full SQL file in Supabase SQL Editor.

Expected SQL file:

```text
hr_attendance_supabase_full_recreate.sql
```

Important:

- Run this only on a fresh Supabase project or after backup.
- This SQL recreates the tables.
- Check that there is no error after running it.

After running, check tables:

```sql
select * from public.roles;
select * from public.employees;
select * from public.app_users;
select * from public.qr_locations;
```

Expected result:

- Roles exist.
- Employees exist.
- App users exist.
- QR locations exist.

---

### [x] Step 1.3 — Create Supabase Auth users

In Supabase Dashboard:

```text
Authentication → Users → Add user
```

Create users with emails matching your `app_users.email` values.

Example:

```text
admin@example.com
sophea@example.com
philip@example.com
```

Use test passwords during development.

---

### [x] Step 1.4 — Link Supabase Auth users to app_users

After creating Auth users, run this SQL:

```sql
update public.app_users au
set auth_user_id = u.id
from auth.users u
where lower(u.email) = lower(au.email)
  and au.auth_user_id is null;
```

Then check:

```sql
select
  au.id,
  au.email,
  au.auth_user_id,
  au.employee_id,
  r.name as role
from public.app_users au
join public.roles r on r.id = au.role_id;
```

Expected result:

```text
auth_user_id must not be null for users that can login.
```

If `auth_user_id` is still null, check:

- Email in `auth.users` is different from `app_users.email`
- Auth user was not created
- You are in the wrong Supabase project

---

### [x] Step 1.5 — Test RLS helper functions

Login user mapping depends on helper functions.

Run this after logging in from frontend later:

```sql
select public.current_app_user_id();
select public.current_employee_id();
select public.current_role_name();
select public.is_admin_or_hr();
```

If these return null/false unexpectedly, usually the problem is:

```text
app_users.auth_user_id is not linked to auth.users.id
```

---

### [x] Step 1.6 — Test employees policies

Run:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'employees';
```

Expected result:

- SELECT policy exists
- INSERT policy exists for Admin/HR
- UPDATE policy exists for Admin/HR
- DELETE policy exists for Admin/HR

---

### [x] Step 1.7 — Test QR location data

Run:

```sql
select * from public.qr_locations where is_active = true;
```

Expected result:

```text
At least one active QR location exists.
```

If no QR location exists, insert one:

```sql
insert into public.qr_locations
(name, qr_code_value, location, latitude, longitude, is_active)
values
('Main Office Entrance', 'HR_QR_MAIN_OFFICE_001', 'Main Office', 11.5564000, 104.9282000, true)
on conflict (qr_code_value) do nothing;
```

---

## 5. Phase 2 — Ionic Vue Project Setup

### Step 2.1 — Install dependencies

Run:

```bash
npm install @supabase/supabase-js
npm install pinia
```

For QR scanner, install later depending on your plugin choice.

Example:

```bash
npm install @capacitor-mlkit/barcode-scanning
npx cap sync
```

---

### Step 2.2 — Create environment files

Create `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Create `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Do not put secret keys in these files.

---

### Step 2.3 — Generate Supabase database types

Run:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/database.types.ts
```

Create folder first if missing:

```bash
mkdir -p src/types
```

Expected file:

```text
src/types/database.types.ts
```

This lets TypeScript and AI understand your database tables and columns.

---

### Step 2.4 — Create Supabase client

Create file:

```text
src/lib/supabase.ts
```

Code:

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

---

### Step 2.5 — Suggested folder structure

Create this structure:

```text
src/
  lib/
    supabase.ts
  types/
    database.types.ts
  stores/
    auth.ts
  router/
    index.ts
  services/
    authService.ts
    attendanceService.ts
    employeeService.ts
    requestService.ts
    adminService.ts
  layouts/
    EmployeeLayout.vue
    AdminLayout.vue
  pages/
    auth/
      LoginPage.vue
    employee/
      EmployeeHomePage.vue
      QRScannerPage.vue
      MyAttendancePage.vue
      LeaveRequestPage.vue
      OvertimeRequestPage.vue
      CorrectionRequestPage.vue
      NotificationsPage.vue
      ProfilePage.vue
    admin/
      AdminDashboardPage.vue
      EmployeesPage.vue
      AttendancePage.vue
      QRLocationsPage.vue
      ScanLogsPage.vue
      LeaveRequestsPage.vue
      OvertimeRequestsPage.vue
      CorrectionsPage.vue
      DepartmentsPage.vue
      PositionsPage.vue
      SchedulesPage.vue
      HolidaysPage.vue
      LeaveTypesPage.vue
      AuditLogsPage.vue
  components/
    common/
    attendance/
    employee/
    admin/
```

---

## 6. Phase 3 — Authentication and Role Loading

### Step 3.1 — Create auth service

Create:

```text
src/services/authService.ts
```

Functions to build:

```text
login(email, password)
logout()
getCurrentAuthUser()
loadAppUserProfile()
loadCurrentUserContext()
```

Implementation example:

```ts
import { supabase } from '@/lib/supabase'

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function loadCurrentUserContext() {
  const user = await getCurrentAuthUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('app_users')
    .select(`
      *,
      roles(*),
      employees(*, departments(*), positions(*))
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (error) throw error

  return {
    authUser: user,
    appUser: data,
    role: data.roles?.name,
    employee: data.employees,
  }
}
```

---

### Step 3.2 — Create auth store

Create:

```text
src/stores/auth.ts
```

State:

```text
user
appUser
employee
role
loading
isAuthenticated
```

Actions:

```text
loginAction()
logoutAction()
loadSession()
hasRole()
isAdminOrHR()
```

Example:

```ts
import { defineStore } from 'pinia'
import {
  login,
  logout,
  loadCurrentUserContext,
} from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authUser: null as any,
    appUser: null as any,
    employee: null as any,
    role: null as string | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.authUser,
    isAdminOrHR: (state) => ['Admin', 'HR Manager'].includes(state.role || ''),
    isManager: (state) => state.role === 'Manager',
    isEmployee: (state) => state.role === 'Employee',
  },

  actions: {
    async loginAction(email: string, password: string) {
      this.loading = true
      try {
        await login(email, password)
        await this.loadSession()
      } finally {
        this.loading = false
      }
    },

    async loadSession() {
      const context = await loadCurrentUserContext()

      if (!context) {
        this.authUser = null
        this.appUser = null
        this.employee = null
        this.role = null
        return
      }

      this.authUser = context.authUser
      this.appUser = context.appUser
      this.employee = context.employee
      this.role = context.role
    },

    async logoutAction() {
      await logout()
      this.authUser = null
      this.appUser = null
      this.employee = null
      this.role = null
    },
  },
})
```

---

### Step 3.3 — Build login page

Create:

```text
src/pages/auth/LoginPage.vue
```

UI fields:

```text
Email
Password
Login button
Error message
Loading state
```

Login logic:

```text
User enters email/password
↓
Call authStore.loginAction(email, password)
↓
Load app_users profile
↓
Redirect by role
```

Redirect:

```ts
if (authStore.isAdminOrHR) {
  router.replace('/admin/dashboard')
} else {
  router.replace('/employee/home')
}
```

---

### Step 3.4 — Create route guard

In:

```text
src/router/index.ts
```

Rules:

```text
If route requires auth and user is not logged in → /login
If admin route and role is not Admin/HR Manager → /employee/home
If employee route and user is not authenticated → /login
```

Example meta:

```ts
{
  path: '/admin/dashboard',
  component: () => import('@/pages/admin/AdminDashboardPage.vue'),
  meta: { requiresAuth: true, roles: ['Admin', 'HR Manager'] },
}
```

Guard logic:

```ts
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.authUser) {
    await authStore.loadSession()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(authStore.role || '')) {
    return '/employee/home'
  }
})
```

---

## 7. Phase 4 — Employee Core Pages

## Feature 1 — Employee Home Page

### Goal

Show today attendance and employee summary.

### File

```text
src/pages/employee/EmployeeHomePage.vue
```

### Data needed

```text
Current employee from auth store
Today attendance from attendance_records
Unread notifications from notifications
```

### Service function

Create in:

```text
src/services/attendanceService.ts
```

```ts
import { supabase } from '@/lib/supabase'

export async function getMyTodayAttendance(employeeId: number) {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('attendance_date', today)
    .maybeSingle()

  if (error) throw error
  return data
}
```

### UI checklist

- [ ] Show employee full name
- [ ] Show employee code
- [ ] Show today date
- [ ] Show check-in
- [ ] Show check-out
- [ ] Show worked hours
- [ ] Show late minutes
- [ ] Show attendance status
- [ ] Add button to Scan QR
- [ ] Add button to My Attendance

### Test

- [ ] Login as employee
- [ ] Open home page
- [ ] Home page shows employee info
- [ ] If no attendance today, show `Not Checked In`

---

## Feature 2 — QR Scanner Page

### Goal

Employee scans QR and system records check-in/check-out.

### File

```text
src/pages/employee/QRScannerPage.vue
```

### Required function in Supabase

```text
process_qr_attendance()
```

### Service function

Add in:

```text
src/services/attendanceService.ts
```

```ts
export async function processQrAttendance(payload: {
  qrCodeValue: string
  logType: 'check_in' | 'check_out' | 'break_in' | 'break_out'
  deviceId?: string
  location?: string
  latitude?: number
  longitude?: number
  ipAddress?: string
}) {
  const { data, error } = await supabase.rpc('process_qr_attendance', {
    p_qr_code_value: payload.qrCodeValue,
    p_log_type: payload.logType,
    p_device_id: payload.deviceId || null,
    p_location: payload.location || null,
    p_latitude: payload.latitude || null,
    p_longitude: payload.longitude || null,
    p_ip_address: payload.ipAddress || null,
  })

  if (error) throw error
  return data
}
```

### UI flow

```text
Open QR scanner page
↓
Choose action: Check In or Check Out
↓
Scan QR code
↓
Call processQrAttendance()
↓
Show success or error
↓
Refresh today attendance
```

### UI checklist

- [ ] Add action selector: Check In / Check Out
- [ ] Add scan button
- [ ] Add manual QR input for development testing
- [ ] Show loading while processing
- [ ] Show success message
- [ ] Show error message if QR invalid
- [ ] Navigate back to Home after success

### Development testing without camera

Use a manual text input:

```text
HR_QR_MAIN_OFFICE_001
```

Call the same RPC function.

### Test

- [ ] Login as employee
- [ ] Open QR page
- [ ] Input valid QR code
- [ ] Click Check In
- [ ] attendance_logs row created
- [ ] attendance_records row created
- [ ] Check Out updates same attendance record
- [ ] Invalid QR shows clear error

---

## Feature 3 — My Attendance Page

### Goal

Employee views own attendance history.

### File

```text
src/pages/employee/MyAttendancePage.vue
```

### Service function

```ts
export async function getMyAttendanceHistory(employeeId: number, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate)
    .order('attendance_date', { ascending: false })

  if (error) throw error
  return data || []
}
```

### UI checklist

- [ ] Month filter
- [ ] Attendance list
- [ ] Status chip
- [ ] Check-in/check-out time
- [ ] Worked hours
- [ ] Late minutes
- [ ] Overtime minutes
- [ ] Empty state

### Test

- [ ] Employee can see own records
- [ ] Employee cannot see other employee records
- [ ] Month filter works

---

## Feature 4 — Employee Profile Page

### Goal

Employee views profile, department, position, schedule, role.

### File

```text
src/pages/employee/ProfilePage.vue
```

### Data source

Use auth store context:

```text
authStore.employee
authStore.appUser
authStore.role
```

### UI checklist

- [ ] Name
- [ ] Employee code
- [ ] Email
- [ ] Phone
- [ ] Department
- [ ] Position
- [ ] Manager
- [ ] Role
- [ ] Status

---

## 8. Phase 5 — Admin / HR Dashboard

## Feature 5 — Admin Dashboard Page

### Goal

Admin/HR sees today HR attendance summary.

### File

```text
src/pages/admin/AdminDashboardPage.vue
```

### Data needed

```text
employees
attendance_records
leave_requests
overtime_requests
attendance_corrections
```

### Service function

Create:

```text
src/services/adminService.ts
```

```ts
import { supabase } from '@/lib/supabase'

export async function getTodayDashboardSummary() {
  const today = new Date().toISOString().slice(0, 10)

  const [{ count: totalEmployees }, { data: attendance }, { count: pendingLeave }, { count: pendingOT }, { count: pendingCorrections }] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('attendance_records').select('*').eq('attendance_date', today),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('overtime_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('attendance_corrections').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const records = attendance || []

  return {
    totalEmployees: totalEmployees || 0,
    presentToday: records.filter((r: any) => r.status === 'present').length,
    lateToday: records.filter((r: any) => r.status === 'late').length,
    absentToday: records.filter((r: any) => r.status === 'absent').length,
    missingCheckout: records.filter((r: any) => !r.check_out && r.check_in).length,
    pendingLeave: pendingLeave || 0,
    pendingOT: pendingOT || 0,
    pendingCorrections: pendingCorrections || 0,
  }
}
```

### UI checklist

- [ ] Card: Total Employees
- [ ] Card: Present Today
- [ ] Card: Late Today
- [ ] Card: Absent Today
- [ ] Card: Missing Checkout
- [ ] Card: Pending Leave
- [ ] Card: Pending OT
- [ ] Card: Pending Corrections
- [ ] Recent attendance list

### Test

- [ ] Admin can open dashboard
- [ ] HR Manager can open dashboard
- [ ] Employee cannot open dashboard

---

## Feature 6 — Employee Management Page

### Goal

Admin/HR manages employees.

### File

```text
src/pages/admin/EmployeesPage.vue
```

### Service functions

Create in:

```text
src/services/employeeService.ts
```

Functions:

```text
getEmployees()
getEmployeeById(id)
createEmployee(payload)
updateEmployee(id, payload)
deactivateEmployee(id)
```

### Basic query

```ts
export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*, departments(*), positions(*)')
    .order('id', { ascending: true })

  if (error) throw error
  return data || []
}
```

### UI checklist

- [ ] Employee table/list
- [ ] Search by name/code
- [ ] Filter by department
- [ ] Filter by status
- [ ] Add employee button
- [ ] Edit employee button
- [ ] Deactivate employee button
- [ ] Link employee to app user

### Test

- [ ] Admin can view all employees
- [ ] HR Manager can view all employees
- [ ] Employee cannot view all employees

---

## Feature 7 — Admin Attendance Page

### Goal

Admin/HR views and filters attendance records.

### File

```text
src/pages/admin/AttendancePage.vue
```

### Service function

```ts
export async function getAttendanceRecords(filters: {
  startDate?: string
  endDate?: string
  employeeId?: number
  status?: string
}) {
  let query = supabase
    .from('attendance_records')
    .select('*, employees(*)')
    .order('attendance_date', { ascending: false })

  if (filters.startDate) query = query.gte('attendance_date', filters.startDate)
  if (filters.endDate) query = query.lte('attendance_date', filters.endDate)
  if (filters.employeeId) query = query.eq('employee_id', filters.employeeId)
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data || []
}
```

### UI checklist

- [ ] Date range filter
- [ ] Employee filter
- [ ] Status filter
- [ ] Attendance table
- [ ] View detail button
- [ ] Export later

---

## Feature 8 — QR Locations Page

### Goal

Admin/HR manages official QR codes.

### File

```text
src/pages/admin/QRLocationsPage.vue
```

### Functions

```text
getQrLocations()
createQrLocation()
updateQrLocation()
disableQrLocation()
```

### UI checklist

- [ ] QR location list
- [ ] Add QR location
- [ ] Edit QR location
- [ ] Disable QR location
- [ ] Show QR code value
- [ ] Generate QR image later

### Test

- [ ] Admin can create QR location
- [ ] Employee can read active QR only if policy allows
- [ ] Invalid QR cannot process attendance

---

## Feature 9 — Scan Logs Page

### Goal

Admin/HR checks raw QR scan history.

### File

```text
src/pages/admin/ScanLogsPage.vue
```

### Query

```ts
export async function getScanLogs() {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, employees(*)')
    .order('log_time', { ascending: false })

  if (error) throw error
  return data || []
}
```

### UI checklist

- [ ] Log list
- [ ] Filter by employee
- [ ] Filter by log type
- [ ] Filter by date
- [ ] Show QR code value
- [ ] Show device/location data

---

## 9. Phase 6 — Requests: Leave, Overtime, Correction

## Feature 10 — Leave Request Page

### Employee side file

```text
src/pages/employee/LeaveRequestPage.vue
```

### Admin side file

```text
src/pages/admin/LeaveRequestsPage.vue
```

### Employee actions

- [ ] View own leave requests
- [ ] Create leave request
- [ ] Cancel pending request

### Admin actions

- [ ] View all leave requests
- [ ] Approve leave
- [ ] Reject leave

### Create leave request function

```ts
export async function createLeaveRequest(payload: any) {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Feature 11 — Overtime Request Page

### Employee side file

```text
src/pages/employee/OvertimeRequestPage.vue
```

### Admin side file

```text
src/pages/admin/OvertimeRequestsPage.vue
```

### Employee actions

- [ ] View own OT requests
- [ ] Create OT request
- [ ] Cancel pending request

### Admin actions

- [ ] View all OT requests
- [ ] Approve OT
- [ ] Reject OT

---

## Feature 12 — Attendance Correction Page

### Employee side file

```text
src/pages/employee/CorrectionRequestPage.vue
```

### Admin side file

```text
src/pages/admin/CorrectionsPage.vue
```

### Employee actions

- [ ] View own correction requests
- [ ] Create missing check-in correction
- [ ] Create missing checkout correction

### Admin actions

- [ ] View all corrections
- [ ] Approve correction
- [ ] Reject correction
- [ ] Update attendance record after approval

---

## 10. Phase 7 — Master Data Pages

Build these after MVP attendance is working.

## Feature 13 — Departments Page

File:

```text
src/pages/admin/DepartmentsPage.vue
```

Tasks:

- [ ] List departments
- [ ] Create department
- [ ] Edit department
- [ ] Disable department if needed

---

## Feature 14 — Positions Page

File:

```text
src/pages/admin/PositionsPage.vue
```

Tasks:

- [ ] List positions
- [ ] Create position
- [ ] Edit position
- [ ] Link position to department if needed

---

## Feature 15 — Working Schedules Page

File:

```text
src/pages/admin/SchedulesPage.vue
```

Tasks:

- [ ] List working schedules
- [ ] Create working schedule
- [ ] Edit working schedule
- [ ] Assign schedule to employee

---

## Feature 16 — Leave Types Page

File:

```text
src/pages/admin/LeaveTypesPage.vue
```

Tasks:

- [ ] List leave types
- [ ] Create leave type
- [ ] Edit leave type
- [ ] Disable leave type

---

## Feature 17 — Public Holidays Page

File:

```text
src/pages/admin/HolidaysPage.vue
```

Tasks:

- [ ] List public holidays
- [ ] Add public holiday
- [ ] Edit public holiday
- [ ] Delete/disable public holiday

---

## 11. Phase 8 — Notifications and Audit Logs

## Feature 18 — Notifications

Employee file:

```text
src/pages/employee/NotificationsPage.vue
```

Admin can also have notification view later.

Tasks:

- [ ] List notifications
- [ ] Mark one as read
- [ ] Mark all as read
- [ ] Open related record if exists

---

## Feature 19 — Audit Logs

Admin file:

```text
src/pages/admin/AuditLogsPage.vue
```

Tasks:

- [ ] View audit logs
- [ ] Filter by user
- [ ] Filter by action
- [ ] Filter by table name
- [ ] Filter by date

---

## 12. Phase 9 — Reports and Export

Build later after core app is stable.

Reports:

- [ ] Monthly attendance report
- [ ] Late report
- [ ] Missing checkout report
- [ ] Overtime report
- [ ] Leave report
- [ ] Employee attendance detail report

Export:

- [ ] Export to Excel
- [ ] Export to PDF later

---

## 13. MVP Development Order

Follow this exact order:

```text
1. Supabase SQL setup
2. Create Auth users
3. Link auth.users to app_users.auth_user_id
4. Generate TypeScript database types
5. Create Supabase client
6. Create auth service
7. Create auth store
8. Create login page
9. Create route guard
10. Create Employee layout
11. Create Admin layout
12. Create Employee Home page
13. Create QR Scanner page with manual QR input first
14. Test process_qr_attendance RPC
15. Create My Attendance page
16. Create Admin Dashboard page
17. Create Admin Attendance page
18. Create QR Locations page
19. Create Scan Logs page
20. Create Leave Request pages
21. Create Overtime Request pages
22. Create Attendance Correction pages
23. Create Master Data pages
24. Create Reports
```

Do not jump to reports before QR attendance works.

---

## 14. Testing Checklist

## Supabase Tests

- [ ] Tables created successfully
- [ ] Sample data exists
- [ ] Auth users created
- [ ] `app_users.auth_user_id` linked
- [ ] RLS policies exist
- [ ] QR location exists
- [ ] `process_qr_attendance()` works

## Auth Tests

- [ ] Login works
- [ ] Logout works
- [ ] Session restore works after refresh
- [ ] Role loads correctly
- [ ] Employee profile loads correctly
- [ ] Admin redirects to admin dashboard
- [ ] Employee redirects to employee home

## Employee Tests

- [ ] Employee can view home page
- [ ] Employee can scan check-in
- [ ] Employee can scan checkout
- [ ] Employee can view own attendance
- [ ] Employee cannot view other employee data
- [ ] Employee can create leave request
- [ ] Employee can create OT request
- [ ] Employee can create correction request

## Admin / HR Tests

- [ ] Admin can view dashboard
- [ ] Admin can view all employees
- [ ] Admin can view all attendance
- [ ] Admin can view scan logs
- [ ] Admin can approve leave
- [ ] Admin can reject leave
- [ ] Admin can approve OT
- [ ] Admin can approve correction

## Security Tests

- [ ] No service role key in frontend
- [ ] RLS blocks unauthorized data
- [ ] Employee cannot access admin routes
- [ ] Employee cannot update attendance_records directly
- [ ] Invalid QR code is rejected

---

## 15. Common Problems and Fixes

### Problem: Login works but query returns empty

Cause:

```text
RLS policy blocks data or app_users.auth_user_id is not linked.
```

Fix:

```sql
update public.app_users au
set auth_user_id = u.id
from auth.users u
where lower(u.email) = lower(au.email)
  and au.auth_user_id is null;
```

Then check:

```sql
select email, auth_user_id from public.app_users;
```

---

### Problem: Employee cannot read employees table

Cause:

```text
Missing employees SELECT policy or employee_id link is wrong.
```

Check:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'employees';
```

---

### Problem: QR scan returns invalid QR

Cause:

```text
QR code value does not exist in qr_locations or is_active is false.
```

Check:

```sql
select * from public.qr_locations where qr_code_value = 'HR_QR_MAIN_OFFICE_001';
```

---

### Problem: TypeScript does not know new tables

Fix:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/database.types.ts
```

Restart dev server.

---

## 16. Final Success Criteria

The MVP is successful when:

- [ ] User can login with Supabase Auth
- [ ] System loads role from app_users
- [ ] Employee can check in by QR
- [ ] Employee can check out by QR
- [ ] attendance_logs stores scan history
- [ ] attendance_records stores daily attendance result
- [ ] Employee can view own attendance
- [ ] Admin/HR can view dashboard
- [ ] Admin/HR can view all attendance
- [ ] Employee cannot see admin data
- [ ] RLS policies protect all sensitive tables

---

## 17. First Task to Start Now

Start here:

```text
1. Run Supabase SQL file
2. Create Auth users
3. Link auth_user_id
4. Generate database.types.ts
5. Create src/lib/supabase.ts
6. Build login page
```

Do not start QR Scanner until login and profile loading work correctly.
## Implementation status (June 15, 2026)

- [x] Typed Supabase client and auth/profile loading
- [x] Role-protected `/employee/tabs/*` and `/admin/tabs/*` routes
- [x] Five-tab employee and Admin/HR Ionic layouts
- [x] Employee home metrics, QR RPC scan, attendance history, requests, and profile
- [x] Admin dashboard, employees, attendance, requests, and settings pages
- [x] Shared loading, empty-state, status, metric, profile, attendance, request, toast, and error helpers
- [x] TypeScript check and production build
- [ ] Regenerate `src/types/database.types.ts` from the live project so `auth_user_id`, `qr_locations`, and `process_qr_attendance` no longer need targeted casts
- [ ] Test live login, RLS, QR RPC, request approval, and master-data writes with linked Supabase Auth users
