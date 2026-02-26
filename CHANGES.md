# Change Log — Frontend / Backend Integration

This document describes every file that was modified or created as part of the integration effort, explains why each change was made, and notes its impact on the system.

---

## Backend changes (`FYP_Backend-main/`)

### `requirements.txt`
**Change:** Added `django-cors-headers==4.9.0`.  
**Why:** Without CORS headers the browser blocks every API call from the React dev server (`localhost:5173`) to the Django server (`localhost:8000`). This was a critical blocker for any frontend–backend communication.  
**Impact:** All API requests from the frontend are now allowed. In production, `CORS_ALLOWED_ORIGINS` in `settings.py` must be restricted to the deployed frontend domain.

---

### `FYP_Backend/settings.py`
**Changes:**
1. Added `'corsheaders'` to `INSTALLED_APPS`.
2. Added `corsheaders.middleware.CorsMiddleware` as the **first** middleware (required by the library).
3. Added `CORS_ALLOWED_ORIGINS` allowing `http://localhost:5173`.
4. Added `CORS_ALLOW_CREDENTIALS = True`.

**Why / Impact:** Without `CorsMiddleware` first, CORS pre-flight `OPTIONS` requests return `403`, breaking all authenticated requests from browsers.

---

### `FYP_Backend/urls.py`
**Change:** Added `path('api/token/refresh/', TokenRefreshView.as_view(), ...)` from SimpleJWT.  
**Why:** The frontend needs to silently renew expired access tokens without forcing the user to log in again. The `TokenRefreshView` endpoint accepts the 7-day refresh token and returns a new 1-hour access token.  
**Impact:** Uninterrupted user sessions up to 7 days.

---

### `core/models.py`
**New fields added:**

| Model | New Field | Why |
|-------|-----------|-----|
| `Course` | `course_code` (CharField, unique, nullable) | Frontend identifies courses by code (e.g., "CS301"). Without this field there was no way to look up a course from the frontend's code-based dropdowns. |
| `Teacher` | `department` (CharField) | Frontend's teacher dashboard displays and filters by department. |
| `Management` | `department` (CharField) | Admin profile carries a department for display. |
| `Management` | `role` ('university_admin' / 'event_admin') | Distinguishes university admins from event admins, enabling the frontend to route to the correct dashboard after login. |
| `TaughtCourse` | `program` (CharField) | Teacher dashboard shows program (BSCS, BSIT, …) per taught course. |
| `AttendanceSession` | `program`, `session_type` | Frontend sends program and session type (Lecture/Lab) when starting a session. |
| `AttendanceSession` | `latitude`, `longitude`, `radius_meters` | Enables optional server-side geolocation validation: the backend can reject a QR scan if the student is outside the classroom radius. |
| `AttendanceSession` | `require_rfid` (BooleanField, default True) | The frontend has no RFID hardware, so sessions need to be startable in QR-only mode. When `False`, a QR scan alone marks attendance. |
| `UpdateAttendanceRequest` | `student` made nullable | The frontend's request form is teacher/batch/course-level, not student-level. Nullable student allows the frontend to submit requests without specifying a single student. |
| `UpdateAttendanceRequest` | `batch`, `program`, `attendance_type`, `slots` | Match the fields the teacher dashboard sends when raising a request. |

**New models added:**

| Model | Purpose |
|-------|---------|
| `EventParticipant` | Represents a registered user who can attend events. Linked to a Django `User` account for JWT authentication. |
| `Event` | An event created by an event admin. Linked to `Management` (with `role='event_admin'`). |
| `EventRegistration` | Many-to-many link between `Event` and `EventParticipant` with status. |
| `EventAttendance` | Records when a participant is marked present at an event. |

**Why:** The frontend had a full `EventAdminDashboard` and `EventData.js` with no corresponding backend support at all. These models provide the persistence layer.

---

### `core/migrations/0007_attendancesession_latitude_and_more.py`
Auto-generated Django migration applying all model changes above. No manual edits needed.

---

### `core/serializers.py`
**New / changed serializers:**

| Serializer | Change | Why |
|------------|--------|-----|
| `StudentSerializer` | — (no change) | — |
| `StudentDetailSerializer` *(new)* | Returns full student profile + course attendance stats | Used by `/students/me/`. Computes `classes_attended_count`, `total_classes`, and `attendance_percentage` from the comma-separated string fields. |
| `StudentCourseDetailSerializer` *(new)* | Nested inside `StudentDetailSerializer` | Provides per-course attendance numbers the frontend dashboard expects. |
| `TeacherSerializer` | Added `department` field | Exposes new field. |
| `TeacherDetailSerializer` *(new)* | Returns teacher profile + taught courses + derived `batches` / `programs` lists | Used by `/teachers/me/`. |
| `ManagementSerializer` | Added `department`, `role` | Exposes new fields. |
| `CourseSerializer` | Added `course_code` | Frontend lookups. |
| `TaughtCourseSerializer` | Added `program` | New field. |
| `UpdateAttendanceRequestSerializer` | Added `batch`, `program`, `attendance_type`, `slots`; `student_name` now nullable-safe | Match new model fields. |
| `AttendanceSessionSerializer` | Added geo fields, `require_rfid`, `program`, `session_type`, `course_code` | All new session fields accessible via API. |
| `AttendanceRecordSerializer` | Added `course_code` to `session_details` | Frontend displays course code. |
| `QRScanSerializer` | Added optional `latitude`/`longitude` | Student browser can send location for server-side geo-validation. |
| `TeacherRegistrationSerializer` | Added `department` field | Teachers can set department during registration. |
| `ManagementRegistrationSerializer` | Added `department`, `role` fields | Admins and event admins register with different roles. |
| `EventParticipantRegistrationSerializer` *(new)* | Handles participant sign-up | Mirrors pattern of other registration serializers. |
| `EventSerializer` *(new)* | CRUD for events with `registered_count` computed field | Exposes event data to frontend. |
| `EventParticipantSerializer` *(new)* | Basic participant data | Used by `EventParticipantViewSet`. |
| `EventRegistrationSerializer` *(new)* | Event registration data | Used by `EventRegistrationViewSet`. |
| `EventAttendanceSerializer` *(new)* | Event attendance record | Used by attendance endpoints. |

---

### `core/views.py`

**Imports:** Added `math` (for Haversine distance), new model imports (`Event`, `EventParticipant`, etc.), new serializer imports.

**`StudentViewSet`:** Added `me` action (`GET /api/students/me/`) — returns `StudentDetailSerializer` data for the authenticated student.

**`TeacherViewSet`:** Added `me` action (`GET /api/teachers/me/`) — returns `TeacherDetailSerializer`.

**`ManagementViewSet`:** Added `me` action (`GET /api/management/me/`).

**`QRScanView`:**
- Added Haversine distance calculation (`_haversine_distance`).
- Geo-validation block: if the session has `latitude`/`longitude` set and the student sends their location, the API rejects the scan if the student is outside the configured radius.
- QR-only mode: `_mark_attendance_if_complete` now checks `session.require_rfid`. When `False`, a QR scan alone marks the student present.
- `needs_rfid` response field now respects `require_rfid`.

**`ManagementRegistrationView`:** Updated `create` to return `role` in the response so the frontend can route event admins correctly.

**New views:**
- `EventParticipantRegistrationView` — `POST /api/auth/register/participant/`
- `ParticipantLoginView` — `POST /api/auth/login/participant/` — returns JWT + `user_type: 'participant'`
- `EventViewSet` — full CRUD + `registrations`, `attendance`, `mark-attendance` actions
- `EventParticipantViewSet` — CRUD + `me` action
- `EventRegistrationViewSet` — CRUD with `event`/`participant` filters

---

### `core/urls.py`
**Changes:** Registered three new ViewSets in the router:
- `events` → `EventViewSet`
- `event-participants` → `EventParticipantViewSet`
- `event-registrations` → `EventRegistrationViewSet`

Added URL patterns:
- `auth/register/participant/` → `EventParticipantRegistrationView`
- `auth/login/participant/` → `ParticipantLoginView`

---

### `core/tests.py`
**Added 16 new tests** across 6 new test classes:

| Class | Tests | What is verified |
|-------|-------|-----------------|
| `MeEndpointTestCase` | 4 | `/students/me/`, `/teachers/me/`, `/management/me/` — correct data returned; unauthenticated access rejected |
| `QROnlyAttendanceTestCase` | 1 | `require_rfid=False` session: QR scan alone marks present |
| `EventParticipantRegistrationTestCase` | 3 | Participant register success, login success, wrong password rejected |
| `EventManagementTestCase` | 4 | Create event, list events, mark attendance, attendance statistics |
| `ManagementRoleTestCase` | 2 | event_admin role, university_admin default role |
| `CourseCodeTestCase` | 2 | Create course with code, list courses returns code |

**Total tests: 84 (existing) + 16 (new) = 100. All pass.**

---

## Frontend changes (`FYDP-frontend/`)

### `package.json` (via `npm install axios --ignore-scripts`)
**Change:** Added `axios` as a dependency.  
**Why:** Axios provides a cleaner API than `fetch` and makes it easy to add request/response interceptors for automatic JWT attachment and token refresh.

### `src/api/index.js` *(new file)*
Axios instance configured with `VITE_API_URL` base URL, request interceptor to attach `Authorization: Bearer <token>`, and response interceptor to silently refresh expired access tokens.

### `src/api/auth.js` *(new file)*
Functions: `loginStudent`, `loginTeacher`, `loginAdmin`, `loginParticipant`, `registerStudent`, `registerTeacher`, `registerManagement`, `registerParticipant`, `logout`.  
After a successful login the function stores `access_token`, `refresh_token`, and `currentUser` in `localStorage` and returns the server response.

### `src/api/students.js` *(new file)*
Functions: `getMyProfile` (calls `/students/me/`), `submitQRScan`, `listStudents`.

### `src/api/teachers.js` *(new file)*
Functions: `getMyProfile`, `startSession`, `stopSession`, `getQRCode`, `getSessionAttendance`, `listSessions`, `submitAttendanceRequest`, `listTeachers`, `listCourses`.

### `src/api/admin.js` *(new file)*
Functions: `getMyProfile`, `listStudents`, `listTeachers`, `listCourses`, `listAttendanceRequests`, `approveAttendanceRequest`, `rejectAttendanceRequest`.

### `src/api/events.js` *(new file)*
Functions: `listEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `getEventRegistrations`, `getEventAttendance`, `markEventAttendance`, `registerForEvent`.

### `src/pages/Login.jsx`
**Before:** Read plain-text credentials from static `TeacherData.js`, `AdminData.js`, or `localStorage`.  
**After:** Calls `loginStudent`/`loginTeacher`/`loginAdmin`/`loginParticipant` from `src/api/auth.js`. Shows a loading state and a proper error message on failure. Removed the `advisor` role option (no backend counterpart) and added `participant` login. Event admins are automatically routed to `/eventadmin` based on the `role` field in the login response.

### `src/pages/SignUp.jsx`
**Before:** Wrote new accounts only to `localStorage`.  
**After:** Calls `registerManagement` or `registerParticipant` from `src/api/auth.js`. Validates password confirmation client-side. On success navigates to `/login`. Shows server error messages inline.

### `src/pages/AdminDashboard.jsx`
**Before:** Loaded students, teachers, courses, and attendance requests from `adminData` static file and `localStorage`.  
**After:** Loads data from the API (`listStudents`, `listTeachers`, `listCourses`, `listAttendanceRequests`) on tab change. Auth check uses the JWT-issued `currentUser` blob rather than comparing against the static admin email.

### `src/components/admin/AttendenceRequest.jsx`
**Before:** Filtered requests from `localStorage` and removed them from `localStorage` on approve/reject.  
**After:** Calls `approveAttendanceRequest` or `rejectAttendanceRequest` from `src/api/admin.js`. Shows an error alert if the API call fails. Updated field names to match the backend serializer (`teacher_name`, `course_name`, `requested_at`, etc.).

### `src/components/GenerateQRCode.jsx`
**Before:** Built a full JSON payload (course, batch, program, geolocation) locally and rendered it as a QR with `react-qr-code`. No server communication.  
**After:** Calls `startSession` from `src/api/teachers.js` to create a server-side attendance session, then renders the backend-issued `qr_code_token` string as the QR value. The token is opaque and meaningless outside the session — spoofing is impossible. The stop button calls `stopSession`. Accepts new props: `teacherId`, `courseId`, `section`, `year`, `program`, `sessionType`, `requireRfid`, `geo`.

### `src/App.jsx`
**Removed:** `useEffect` call to `initStudents()` and `initTeachers()` which seeded `localStorage` from static files on every app load. This was incompatible with real API authentication because locally seeded passwords could shadow real accounts.

### `.env.development` *(new file)*
Configures `VITE_API_URL=http://localhost:8000/api` as the default backend URL. Override this to point to a staging or production backend without touching source files.

### `src/pages/EventAdminDashboard.jsx`
**Minor fix:** Corrected a CSS import (`eventAdmin.css` → `eventadmin.css`) to match the actual file-system casing, which caused a build failure on case-sensitive file systems (Linux).

---

## Documentation

### `INTEGRATION_PLAN.md` *(created in previous session)*
Initial analysis document identifying all gaps, mismatches, and required changes. This CHANGES.md and SETUP.md replace the "future work" sections of that plan.

### `SETUP.md` *(new)*
Step-by-step guide to install, configure, and run the backend and frontend locally, including test commands, environment variables, and a quick API reference.

### `CHANGES.md` *(this file)*
Comprehensive record of what changed and why.

---

## Security notes

- Plain-text passwords in `StudentData.js`, `TeacherData.js`, and `AdminData.js` are no longer used for authentication. Those files are kept as reference/mock data but are not imported by the login flow. They can be deleted once all data is managed through the API.
- The Django `SECRET_KEY` in `settings.py` is still a development placeholder. It **must** be replaced with a strong random value and loaded from an environment variable before any production deployment.
- `DEBUG = True` in `settings.py` must be set to `False` in production.
- `CORS_ALLOWED_ORIGINS` must list only the production frontend domain in production.
- The RFID scan endpoint (`POST /api/attendance/rfid-scan/`) is intentionally `AllowAny` to allow hardware scanners without web browsers. In production, restrict access by IP or add a shared hardware secret header.
