# HR Attendance QR Scanning App

An Ionic Vue + Supabase HR attendance system for employee QR check-in/check-out, attendance tracking, leave requests, overtime requests, correction requests, and an Admin/HR dashboard.

## Project Goal

The system allows employees to log in, scan a valid company QR code, and record attendance securely. Admin/HR users can manage employees, view attendance, approve requests, and monitor scan activity.

```text
Employee logs in
→ Employee scans QR code
→ Supabase validates the QR code
→ System saves scan log
→ System creates or updates daily attendance record
→ Admin/HR reviews dashboard and reports
```

## Tech Stack

- Ionic Vue
- Vue 3
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase RPC functions
- Capacitor QR scanner plugin

## Main Roles

| Role | Access |
|---|---|
| Admin | Full system access |
| HR Manager | Manage employees, attendance, leave, OT, corrections, and settings |
| Manager | View own team and related requests |
| Employee | Scan QR, view own attendance, submit leave/OT/correction requests |

## Database Design

The app uses Supabase Auth for login and `public.app_users` for app profile and role mapping.

```text
auth.users
  ↓ linked by auth_user_id
public.app_users
  ↓ linked by employee_id
public.employees
```

Important tables:

```text
roles
departments
positions
employees
app_users
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

## Authentication Flow

1. User logs in with Supabase Auth.
2. App gets current authenticated user.
3. App loads `app_users` using `auth_user_id = auth.users.id`.
4. App loads role and employee profile.
5. App redirects user based on role.

Example:

```ts
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (authError) throw authError

const { data: appUser, error: appUserError } = await supabase
  .from('app_users')
  .select('*, roles(*), employees(*)')
  .eq('auth_user_id', authData.user.id)
  .single()

if (appUserError) throw appUserError
```

## QR Attendance Flow

Employees should not directly calculate attendance in the frontend. The frontend should call a Supabase RPC function.

```text
Scan QR
→ Call process_qr_attendance()
→ Validate logged-in employee
→ Validate QR location
→ Insert attendance_logs
→ Create/update attendance_records
→ Return success/error result
```

Example:

```ts
const { data, error } = await supabase.rpc('process_qr_attendance', {
  p_qr_code_value: scannedValue,
  p_log_type: 'check_in',
  p_device_id: deviceId,
  p_location: locationName,
  p_latitude: latitude,
  p_longitude: longitude,
  p_ip_address: null,
})

if (error) throw error
```

## Environment Setup

Create `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not put `service_role`, secret keys, or personal access tokens in the frontend.

## Install Dependencies

```bash
npm install
npm install @supabase/supabase-js
```

For QR scanning, install the scanner plugin used by your project, for example:

```bash
npm install @capacitor-mlkit/barcode-scanning
npx cap sync
```

## Supabase Setup

### 1. Run SQL File

Run the complete recreate SQL file in Supabase SQL Editor:

```text
hr_attendance_supabase_full_recreate.sql
```

Only run this file on a fresh project or after backup because it recreates the HR database tables.

### 2. Create Auth Users

Create Supabase Auth users with emails matching the seeded `app_users.email` records.

Example users:

```text
admin@example.com
sophea@example.com
philip@example.com
```

### 3. Link Auth Users to App Users

After creating Auth users, run:

```sql
update public.app_users au
set auth_user_id = u.id
from auth.users u
where lower(u.email) = lower(au.email)
  and au.auth_user_id is null;
```

### 4. Check Link Result

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

`auth_user_id` must not be null for users who need to log in.

## Generate Supabase Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/database.types.ts
```

Use the generated type in your Supabase client:

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
```

## Recommended Folder Structure

```text
src/
  lib/
    supabase.ts
  stores/
    auth.ts
  router/
    index.ts
  pages/
    auth/
      LoginPage.vue
    employee/
      EmployeeHomePage.vue
      ScanPage.vue
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
      QrLocationsPage.vue
      ScanLogsPage.vue
      LeaveRequestsPage.vue
      OvertimeRequestsPage.vue
      CorrectionsPage.vue
      DepartmentsPage.vue
      PositionsPage.vue
      WorkingSchedulesPage.vue
      PublicHolidaysPage.vue
      LeaveTypesPage.vue
      AuditLogsPage.vue
  components/
  types/
    database.types.ts
```

## Employee Pages

- Login
- Home dashboard
- QR scanner
- My attendance
- Leave requests
- Overtime requests
- Attendance corrections
- Notifications
- Profile

## Admin/HR Pages

- Dashboard
- Employees
- Attendance records
- QR locations
- QR scan logs
- Leave requests
- Overtime requests
- Attendance corrections
- Departments
- Positions
- Working schedules
- Public holidays
- Leave types
- Notifications
- Audit logs

## Testing Checklist

### Login Test

- User can log in with Supabase Auth.
- App loads `app_users` profile.
- App loads role correctly.
- User redirects to the correct dashboard.

### Employee QR Test

- Employee scans active QR code.
- `attendance_logs` gets new record.
- `attendance_records` gets created or updated.
- Check-in is not overwritten if already exists.
- Check-out updates correctly.

### Admin Test

- Admin can view all employees.
- Admin can view all attendance records.
- Admin can view all scan logs.
- Admin can manage QR locations.

### Employee Security Test

- Employee can view only own attendance.
- Employee cannot update attendance records directly.
- Employee cannot view another employee profile.

## Troubleshooting

### Login works but data is empty

Usually this is caused by RLS or missing `auth_user_id` mapping.

Check:

```sql
select id, email, auth_user_id, employee_id
from public.app_users;
```

If `auth_user_id` is null, run the link SQL again.

### Table has data but Vue query returns empty

Check RLS policies:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public';
```

### Query app_users with correct column

Do not use:

```ts
.eq('id', user.id)
```

Use:

```ts
.eq('auth_user_id', user.id)
```

because Supabase Auth user ID is UUID, while `app_users.id` may be bigint.

## Security Rules

- Never expose `service_role` key in Ionic Vue.
- Use RLS for all public tables.
- Do not trust employee ID from frontend.
- Get employee ID from `auth.uid()` through database functions.
- Process attendance in Supabase RPC, not only frontend code.
- Admin/HR permissions must be checked by database policies.

## MVP Scope

Build first:

1. Login and auth store
2. Role-based redirect
3. Employee home page
4. QR scanner page
5. My attendance page
6. Admin dashboard
7. Admin attendance page
8. QR locations page

After MVP:

1. Leave request approval
2. Overtime approval
3. Attendance correction approval
4. Reports and export
5. Audit log viewer
