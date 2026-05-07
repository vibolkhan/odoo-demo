# Project Reorganization Walkthrough

I have improved the directory structure of `src/views` and `src/components` to make it more intuitive and feature-oriented.

## 📁 Updated Directory Structure

### `src/components`
Organized into subdirectories by purpose:
- **`common/`**: Reusable generic components (prefixed with `App` or shared inputs).
  - `AppAsyncState.vue`
  - `AppAvatar.vue`
  - `AppEmptyState.vue`
  - `AppSkeleton.vue`
  - `DateInput.vue`
- **`attendance/`**: Components specific to attendance tracking.
  - `AttendanceDetailModal.vue`
- **`leave/`**: Components specific to time-off and leave requests.
  - `LeaveRequestDetailModal.vue`
  - `PublicHolidayDetailModal.vue`
  - `RequestForm.vue`
  - `RequestList.vue` (Renamed from `RequestLst.vue` 🔧)

### `src/views`
Organized into subdirectories by feature module:
- **`auth/`**: Authentication pages (`LoginPage.vue`).
- **`attendance/`**: Attendance-related pages (`AdminAttendancePage.vue`, `MyAttendancePage.vue`).
- **`leave/`**: Time-off and leave management pages (`LeaveApprovalPage.vue`, `LeaveBalancePage.vue`, etc.).
- **`profile/`**: User profile pages (`ProfilePage.vue`).
- **`layout/`**: Application layout components (`TabsPage.vue`).

## 🧹 Cleaned Up
- Removed unused Ionic boilerplate: `Tab1Page.vue` and `ExploreContainer.vue`.

## 🛠️ Technical Changes
- All component and view imports in `router/index.js` and within individual components have been updated to use the new paths.
- Corrected the typo in `RequestLst.vue` to `RequestList.vue` across the entire codebase.
- Standardized imports to use the `@/` alias where appropriate to avoid deeply nested relative paths.
