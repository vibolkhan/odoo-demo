# UX/UI QA Report — HR Attendance App

**Prepared by:** Senior QA Engineer (Playwright MCP)
**Date:** 2026-06-22
**Tested URL:** http://localhost:5173
**Branch:** feat/hrms
**Viewports tested:** Desktop (1280×800), Mobile (375×812)

---

## Summary

The app is functionally usable for both Employee and Admin roles. Navigation, authentication, and core data display work correctly. However, several **critical form bugs, mobile layout breakages, and data quality issues** require attention before this is production-ready. The most urgent item is that the **Add Employee form submits silently with no validation** — empty fields produce no error messages and no visible user feedback.

---

## Tested Pages

| Page | Role | Status |
|---|---|---|
| `/login` | Guest | ✅ Tested |
| `/employee/tabs/home` | Employee | ✅ Tested |
| `/employee/tabs/scan` | Employee | ✅ Tested |
| `/employee/tabs/attendance` | Employee | ✅ Tested |
| `/employee/tabs/requests` | Employee | ✅ Tested |
| `/employee/tabs/profile` | Employee | ✅ Tested |
| `/admin/tabs/dashboard` | Admin | ✅ Tested |
| `/admin/tabs/employees` | Admin | ✅ Tested |
| `/admin/tabs/attendance` | Admin | ✅ Tested |
| `/admin/tabs/requests` | Admin | ✅ Tested |
| `/admin/tabs/settings` (QR, Departments, Positions, Leave Types) | Admin | ✅ Tested |
| Register page | — | ⚠️ Does not exist (redirects to login) |

---

## Bug List

### 🔴 HIGH — Must fix before release

---

#### BUG-001 · Add Employee form: no validation, silent failure on empty submit

**Page:** Admin → Employees → ADD
**Steps:** Open the "New employee" modal → click CREATE EMPLOYEE without filling any field.
**Expected:** Validation errors appear under each required field (Employee code, First name, Last name, Hire date).
**Actual:** No error messages shown. A success toast fires silently with an empty message. The modal stays open and the record may or may not be written to the database — the user receives zero feedback.
**Impact:** Admins can submit a completely blank employee record or be confused about whether the action succeeded.

```
Console errors: none
Toast state after submit: { color: "success", msg: "", open: false }
```

---

#### BUG-002 · Admin Settings tab is clipped off-screen on mobile

**Page:** Admin → any page (mobile 375px)
**Observation:** The admin tab bar has 6 tabs (Dashboard, Scan, Employees, Attendance, Requests, Settings). Each tab is 72px wide → 432px total, which overflows the 375px viewport. The Settings tab sits at x=360–432, making it 57px off-screen.

```
settingsRight: 432  viewportWidth: 375  → 57px hidden
tabBarOverflow: "auto"  (scrollable, but no visual hint)
```

**Expected:** Either the tab bar scrolls with a visible indicator, or Settings is accessible some other way.
**Actual:** Settings tab is invisible. There is no scroll indicator. Users on mobile cannot reach Settings.

---

#### BUG-003 · ADD button on Employees page unresponsive to first click

**Page:** Admin → Employees
**Steps:** Click the "ADD" button in the page header.
**Actual:** First click via normal event dispatch did nothing. Modal only opened after dispatching `MouseEvent` with `bubbles: true` explicitly. This suggests the click target is inside the Ionic shadow DOM and the button's hit area may not be registering taps reliably on certain browsers or touch devices.
**Impact:** Admin may tap ADD and see no response, then tap repeatedly in frustration.

---

### 🟡 MEDIUM — Fix before or shortly after release

---

#### BUG-004 · Attendance "Late" displayed in minutes, "Worked" displayed in hours — inconsistent units

**Page:** Employee → Home (Today's Attendance card), Employee → Attendance list
**Observation:**

```
Worked: 0.01h    Late: 385m
Worked: 0.34h    Late: 571m
Worked: 0.33h    Late: 558m
```

- "Late" is always shown in raw minutes (385m = 6h 25m).
- "Worked" is in fractional hours (0.01h = less than 1 minute).
- The two fields use different units on the same card, which is confusing.
- 385 minutes late on a day with 0.01h worked is also logically contradictory — either the worked calculation or the late calculation has a bug.

---

#### BUG-005 · Orphaned employee record appears in Employees list with no name

**Page:** Admin → Employees
**Observation:** The last list item shows `"- No department"` with an active badge and DEACTIVATE button but no employee name. This is likely an `app_users` row with no linked employee record. It should not appear in the list, or should be clearly flagged as invalid.

---

#### BUG-006 · Add Employee form is missing critical fields

**Page:** Admin → Employees → ADD → "New employee" modal
**Fields present:** Employee code, First name, Last name, Email, Hire date.
**Fields missing:** Department, Position, Role, Phone.
**Impact:** Any employee created through this form will have no department, position, role, or phone — making them appear broken in the employee list (like BUG-005) and unable to log in with a role.

---

#### BUG-007 · Admin Requests page has no filter or search

**Page:** Admin → Requests
**Observation:** The Attendance page has Date, Employee, and Status filters. The Requests page has none — all requests from all employees are shown with no way to filter by employee, date, or status (other than the Leave/Overtime/Correction segment tabs).
**Impact:** As request volume grows this page becomes unusable.

---

#### BUG-008 · "Correction" tab label truncated on mobile Admin Requests page

**Page:** Admin → Requests (mobile 375px)
**Observation:** Screenshot shows the third segment tab rendered as `"CORRECT..."`. The segment does not have `scrollable` set so all three tabs must fit the available width — at narrow viewports the label overflows and gets clipped.

---

### 🟢 LOW — Polish / quality improvements

---

#### BUG-009 · Dirty test data visible in the UI

**Page:** Employee → Requests → Overtime (subtitle: `"vb"`), Correction (subtitle: `"ddd"`)
**Observation:** These are clearly test entries left in the database. The subtitle field shows the `reason` value directly. The UI has no minimum content validation — any garbage text is displayed verbatim to the user.

---

#### BUG-010 · Login page: large dead whitespace on desktop

**Page:** `/login` (desktop 1280×800)
**Observation:** The login form is rendered in a narrow ~360px column that sits vertically in the lower-centre of the page. The top ~250px of the viewport is entirely blank. There is no logo, no app name graphic, no illustration — just grey space. First impression is that the page failed to load.

---

#### BUG-011 · Profile page: hire date shown in ISO format

**Page:** Employee → Profile
**Observation:** Hire date displays as `"2022-08-01"` instead of a human-readable format like `"August 1, 2022"` or `"01 Aug 2022"`.

---

#### BUG-012 · No register page and no in-app explanation

**Page:** `/register`
**Observation:** Navigating to `/register` silently redirects to `/login?notice=registration`. There is no registration flow, and the `notice` query param produces no visible message on the login page. New employees have no way to self-register, and there is no explanation of this anywhere in the UI.

---

#### BUG-013 · Admin tab bar labels truncated on mobile

**Page:** Admin → any page (mobile 375px)
**Observation:** "Dashboard" → `"Dashbo..."`, "Employees" → `"Employ..."`, "Attendance" → `"Attend..."`. Six tabs cannot fit comfortably in 375px. Labels should be shortened by design or the overflow handled with a "More" pattern.

---

#### BUG-014 · "Development QR entry" section visible in production build

**Page:** Employee → Scan
**Observation:** An accordion labelled "Development QR entry" with a pre-filled QR value and "SUBMIT TEST QR VALUE" button is visible to all users. This is a dev/debug tool that should be hidden in production builds (e.g. behind `import.meta.env.DEV`).

---

## UX / UI Improvement Suggestions

### 1. Login page — centre the form and add branding
Add a logo or app name above the form, centre the card vertically, and add a subtle background pattern or illustration. The current blank grey space above the form reads as a broken page on first load.

### 2. "Late" metric — use human-readable time format
Change `385m` → `6h 25m`. Standardise all time displays to `Xh Ym` — mixing decimal hours for worked time and raw minutes for lateness on the same card forces mental arithmetic.

### 3. Admin tab bar — shorten labels or use icon-only on mobile
Options in order of preference:
- Use shorter labels: **Home / Scan / Staff / Hours / Requests / Config**
- Switch to icon-only on mobile (labels visible on ≥480px)
- Add a "More" overflow tab that exposes Settings and any other overflowing tabs

### 4. Admin Requests — show employee name on each card
Each request card shows a date and reason but **no employee name**. At scale this makes triage impossible. Add the full name as a leading subtitle or chip.

### 5. Add Employee modal — add Department, Position, Role fields
See BUG-006. At minimum add a required Role selector and optional Department/Position dropdowns pre-populated from Settings data already in the app.

### 6. Confirmation dialogs before destructive actions
DEACTIVATE and REJECT buttons execute immediately. Add an `ion-alert` confirm step: _"Deactivate Vibol Kim? They will lose system access."_ This is especially important for REJECT on leave/overtime requests.

### 7. Empty states on admin pages
- Admin Attendance: if no records match the current filters, show "No attendance records for this selection."
- Admin Requests (Correction tab): currently shows a blank white page when empty.

### 8. Settings master data — add/edit capability
Departments, Positions, and Leave Types are displayed as read-only lists with no ADD, edit, or delete actions (unlike the QR tab). If editing is planned, this is a significant missing feature. If intentionally read-only, add a label saying so.

### 9. Request cards — add tappable detail view
Request cards in both Employee and Admin views are not tappable. Users cannot view the full record details (all fields, timestamps, approver notes). Consider a detail slide-over or navigating to a detail page on tap.

### 10. Password visibility toggle on login
Add a show/hide eye icon to the password field — standard UX, especially important on mobile where typos are common.

---

## Recommended Next Actions

| Priority | Action | Bug |
|---|---|---|
| 🔴 Immediate | Add validation + error messages to Add Employee form | BUG-001 |
| 🔴 Immediate | Fix admin tab bar overflow on mobile (Settings unreachable) | BUG-002 |
| 🔴 Immediate | Investigate ADD button click area in Ionic shadow DOM | BUG-003 |
| 🟡 Pre-release | Standardise time units — use `Xh Ym` everywhere | BUG-004 |
| 🟡 Pre-release | Filter orphaned user records from Employees list | BUG-005 |
| 🟡 Pre-release | Add Department, Position, Role to Add Employee form | BUG-006 |
| 🟡 Pre-release | Add filter/search to Admin Requests page | BUG-007 |
| 🟡 Pre-release | Fix "Correction" segment tab clipping on mobile | BUG-008 |
| 🟡 Pre-release | Add employee name to Admin Requests list items | — |
| 🟡 Pre-release | Add confirmation dialogs for DEACTIVATE / REJECT | — |
| 🟢 Post-release | Gate "Development QR entry" behind `import.meta.env.DEV` | BUG-014 |
| 🟢 Post-release | Improve login page layout and add branding | BUG-010 |
| 🟢 Post-release | Format hire date as human-readable string | BUG-011 |
| 🟢 Post-release | Show `?notice=registration` message on login page | BUG-012 |
| 🟢 Post-release | Add password visibility toggle to login form | — |
| 🟢 Post-release | Add tappable detail view to request cards | — |

---

## Technical Notes

- **Console errors:** None detected across any tested page ✅
- **Network failures:** Supabase HEAD requests show `ERR_ABORTED` — expected browser behaviour (headers-only, no body needed) ✅
- **Broken navigation links:** None detected ✅
- **Auth guard:** Works correctly — unauthenticated users redirect to `/login`, wrong-role users redirect to their correct home ✅
- **Supabase RLS:** Appears to be working — employee sees only their own attendance and requests ✅
- **Logout flow:** Requires programmatic store call; the LOGOUT button's click event does not propagate correctly via a normal click simulation (shadow DOM issue consistent with BUG-003) ⚠️
