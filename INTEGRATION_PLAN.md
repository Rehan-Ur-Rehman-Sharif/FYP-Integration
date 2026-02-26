# Frontend–Backend Integration Plan

## 1. Overview

This document evaluates the `FYDP-frontend` (React/Vite SPA) and the `FYP_Backend-main` (Django REST Framework) and specifies every change needed to wire the two systems together.

The frontend is currently 100% client-side: it stores users and attendance data in `localStorage` and uses hardcoded static JavaScript files for all seed data.  The backend is a fully-featured REST API with JWT authentication, PostgreSQL persistence, and a 2-factor attendance flow (RFID + QR code token).

---

## 2. Technology Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 3 |
| Backend | Django 5.2, Django REST Framework 3.16, SimpleJWT 5.5 |
| Database | SQLite (dev/test) / PostgreSQL (production) |
| Auth | JWT – access token (1 h), refresh token (7 d) |

---

## 3. Current Frontend Architecture

The frontend has four dashboards behind a single-route SPA:

```
/ → /login  →  /student
                /teacher
                /admin
                /eventadmin
                /signup
```

Every dashboard reads its data exclusively from:

- Static `.js` files: `StudentData.js`, `TeacherData.js`, `AdminData.js`, `EventData.js`
- `localStorage` (used as a temporary database for registered users and attendance requests)
- `RequestContext` (React context for in-memory state sharing)

---

## 4. Current Backend Architecture

All API routes are prefixed with `/api/`:

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login/{student\|teacher\|management}/` |
| Auth | `POST /api/auth/register/{student\|teacher\|management}/` |
| CRUD | `/api/students/`, `/api/teachers/`, `/api/management/` |
| CRUD | `/api/courses/`, `/api/classes/`, `/api/taught-courses/`, `/api/student-courses/` |
| Attendance | `POST /api/attendance-sessions/` (start session) |
| Attendance | `POST /api/attendance-sessions/{id}/stop/` |
| Attendance | `GET  /api/attendance-sessions/{id}/qr/` (base64 QR image) |
| Attendance | `GET  /api/attendance-sessions/{id}/attendance/` |
| Attendance | `POST /api/attendance/rfid-scan/` |
| Attendance | `POST /api/attendance/qr-scan/` |
| Requests | `/api/update-attendance-requests/` (CRUD + approve/reject) |

---

## 5. Gap Analysis

### 5.1 CORS — Critical Blocker

The backend has **no CORS headers** configured. Any API call from the React dev server (`http://localhost:5173`) will be blocked by the browser.

**Required backend change:**

1. Install `django-cors-headers`:
   ```
   pip install django-cors-headers
   ```
2. Add to `INSTALLED_APPS` and `MIDDLEWARE` in `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       'corsheaders',
   ]
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',  # Must be first
       ...
   ]
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:5173',  # Vite dev server
   ]
   ```
3. Add `django-cors-headers` to `requirements.txt`.

---

### 5.2 Authentication System

**Current frontend behaviour:**
- Reads plain-text credentials from `TeacherData.js` / `AdminData.js` or `localStorage` for students.
- Stores a `currentUser` JSON blob in `localStorage` after "login".
- No token is used for subsequent requests.

**Backend behaviour:**
- Issues JWT `access` + `refresh` tokens on successful login.
- All protected endpoints require `Authorization: Bearer <access>`.
- Three separate login URLs: `.../login/student/`, `.../login/teacher/`, `.../login/management/`.

**Role name mismatch:**

| Frontend role | Backend role |
|---------------|-------------|
| `student`     | `student`   |
| `teacher`     | `teacher`   |
| `admin`       | `management`|
| `advisor`     | *(none)*    |
| `eventAdmin`  | *(none)*    |

**Required frontend changes:**

1. Create an `api/` service layer (e.g., `src/api/auth.js`) with functions:
   - `loginStudent(email, password)` → `POST /api/auth/login/student/`
   - `loginTeacher(email, password)` → `POST /api/auth/login/teacher/`
   - `loginManagement(email, password)` → `POST /api/auth/login/management/`
2. Store returned `access` and `refresh` tokens in `localStorage` (or `sessionStorage`).
3. Replace all hardcoded credential checks in `Login.jsx` with the corresponding API call.
4. Add an Axios interceptor (or a `fetch` wrapper) that attaches `Authorization: Bearer <token>` to every authenticated request.
5. Add a token refresh mechanism that calls `/api/token/refresh/` (SimpleJWT default) when the access token expires.

**Required backend change:**
- Add the SimpleJWT token-refresh URL to `FYP_Backend/urls.py`:
  ```python
  from rest_framework_simplejwt.views import TokenRefreshView
  path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  ```

---

### 5.3 Student Data Model Mismatch

**Frontend student object:**
```js
{
  profile: { name, studentId, year, section, department },
  email,
  password,
  overallAttendance: { percentage, status },
  courses: [{ code, name, attendance, present, total }]
}
```

**Backend Student serializer output:**
```json
{
  "student_id", "student_name", "email", "rfid",
  "overall_attendance", "year", "dept", "section"
}
```

**Gaps:**
- Backend has no `courses` array attached to the student response. Course enrollment data is in the `StudentCourse` model.
- Backend `year` is an `IntegerField`; frontend stores `year` as a string like `"2023"` (meaning enrollment batch/year, not academic year level 1–4).
- Backend `dept` is a short code (e.g., `"CS"`); frontend uses a full name (e.g., `"Computer Science"`).
- Backend returns `student_name`; frontend expects `name`.

**Required backend changes:**

1. Add a `/api/students/me/` endpoint (or extend `StudentViewSet`) that returns the profile of the currently authenticated student, including:
   - `student_id`, `student_name`, `email`, `year`, `dept`, `section`, `overall_attendance`
   - Nested `courses` list from `StudentCourse` (course code, course name, `classes_attended` count, total classes taken).
2. Consider adding a `department_full_name` field to the `Course` or `Teacher` model, or standardise the `dept` values to match the frontend's display names.

**Required frontend changes:**

1. Remove static imports of `StudentData.js` from `StudentDashboard.jsx`.
2. After login, call the `/api/students/me/` endpoint with the JWT token.
3. Map the API response field names (`student_name` → `name`, integer `year` → string, etc.) in a normalisation helper.
4. Replace `initStudents()` / `localStorage` seeding in `App.jsx` with this API-driven approach.

---

### 5.4 Teacher Data Model Mismatch

**Frontend teacher object (TeacherData.js):**
```js
{
  profile: { name, teacherId, department, avatar, coursesTeaching, email, password },
  batches: [...],
  programs: [...],
  attendanceTypes: [...],
  courses: [{ code, name }]
}
```

**Backend Teacher serializer output:**
```json
{ "teacher_id", "teacher_name", "email", "rfid" }
```

**Gaps:**
- Backend `Teacher` has no `department`, `batches`, `programs`, or `attendanceTypes` fields.
- `TaughtCourse` has `section` and `year`, but no `program` or `batch` concept.
- There is no `avatar` field.

**Required backend changes:**

1. Add `department` field to the `Teacher` model and migration.
2. Add a `/api/teachers/me/` endpoint that returns the authenticated teacher's profile plus their taught courses (via `TaughtCourse`) with year and section.
3. Decide on `batches`, `programs`, and `attendanceTypes` — either add them as configurable fields/FK relations or derive them from `TaughtCourse.year` and a new `Program` model.  At minimum, add a new `program` field to `TaughtCourse` (currently only has `section` and `year`).

**Required frontend changes:**

1. Remove static imports of `TeacherData.js` from `TeacherDashboard.jsx`.
2. After teacher login, call `/api/teachers/me/` and populate state from the response.
3. Derive the `batches`, `programs`, and `attendanceTypes` drop-down values from the API response.

---

### 5.5 Admin (Management) Data Model Mismatch

**Frontend admin object (AdminData.js):**
```js
{
  profile: { adminId, name, email, password, department },
  years, batches, programs, departments, courses,
  studentAttendanceRecords, attendanceRequests, students, teachers
}
```

**Backend Management serializer:**
```json
{ "Management_id", "Management_name", "email" }
```

**Gaps:**
- No `department` on the `Management` model.
- The admin dashboard needs list endpoints for students, teachers, and attendance records — all of which exist on the backend but are not yet called from the frontend.

**Required backend changes:**

1. Add `department` field to the `Management` model and migration.
2. (Optional) Add a `/api/management/me/` endpoint returning the authenticated manager's profile.

**Required frontend changes:**

1. Replace `adminData.students`, `adminData.teachers`, and `adminData.courses` in `AdminDashboard.jsx` with API calls to `/api/students/`, `/api/teachers/`, and `/api/courses/`.
2. Replace `adminData.profile` credential check with the JWT flow.

---

### 5.6 QR Code / Attendance Session Flow — Major Architectural Gap

This is the most significant integration challenge.

**Current frontend flow:**

1. Teacher fills out a form (batch, program, course, type, slots) in `TeacherDashboard.jsx`.
2. `GenerateQRCode.jsx` builds a JSON payload locally:
   ```json
   {
     "course": "CS301",
     "batch": "2023",
     "program": "BSCS",
     "type": "Lecture",
     "slots": "2",
     "date": "<ISO timestamp>",
     "geoLocation": { "lat": ..., "lng": ..., "radius": 50 }
   }
   ```
3. The QR is rendered client-side using `react-qr-code` — **no API call is made**.
4. Students use the browser camera (`Html5Qrcode`) to scan the QR, decode the JSON, verify geolocation, and display the result locally — **no API call is made**.

**Backend attendance flow:**

1. Teacher calls `POST /api/attendance-sessions/` → backend generates a unique opaque `qr_code_token`.
2. Teacher calls `GET /api/attendance-sessions/{id}/qr/` → backend returns a base64-encoded PNG of the token.
3. RFID hardware calls `POST /api/attendance/rfid-scan/` with the student RFID and session ID.
4. Student calls `POST /api/attendance/qr-scan/` with `{ qr_token, student_id }`.
5. Attendance is marked **only after both RFID and QR scans succeed**.

**Key incompatibilities:**

| Issue | Detail |
|-------|--------|
| QR content | Frontend embeds full course/geo JSON; backend embeds an opaque token |
| Geolocation | Frontend validates location client-side; backend has no geolocation concept |
| RFID | Frontend has no RFID flow; backend requires RFID as first factor |
| Session lifecycle | Frontend has no concept of a server-side session; backend tracks session state |
| Attendance persistence | Frontend only shows a local JSON blob; no data is saved to the database |

**Recommended integration approach:**

There are two options:

**Option A — Adapt frontend to use the backend's token-based QR (Recommended):**

1. Teacher submits the form → frontend calls `POST /api/attendance-sessions/` with `{ teacher, course, section, year }`.
2. Frontend calls `GET /api/attendance-sessions/{id}/qr/` and renders the returned base64 image (replacing `react-qr-code`).
3. Alternatively, the frontend can render its own QR using `react-qr-code` with just the token string as the value (simpler approach: `<QRCode value={qr_code_token} />`).
4. Student scans the QR → obtains the token string → calls `POST /api/attendance/qr-scan/` with `{ qr_token, student_id }`.
5. Geolocation validation is moved to a **backend addition** (see Section 5.6.1 below) or kept client-side as an optional pre-check.
6. RFID remains a separate hardware concern; a "QR-only mode" should be added to the backend (see Section 5.6.2).

**Option B — Keep the frontend QR flow and add a backend endpoint to receive it:**

1. Teacher generates QR client-side as today.
2. Student scans QR and the frontend calls a new backend endpoint `POST /api/attendance/submit/` sending the full decoded QR payload + student ID.
3. Backend validates the token/course/geolocation server-side and records attendance.

Option A is preferred because it aligns with the backend's existing design and keeps the source of truth on the server.

#### 5.6.1 Backend change: optional geolocation on attendance session

Add `latitude`, `longitude`, and `radius_meters` optional fields to `AttendanceSession` so the backend can validate location when a student submits a QR scan.

```python
# In AttendanceSession model:
latitude = models.FloatField(null=True, blank=True)
longitude = models.FloatField(null=True, blank=True)
radius_meters = models.IntegerField(default=50, null=True, blank=True)
```

Update `QRScanView` to check the student's submitted coordinates against the session's stored location if present.

#### 5.6.2 Backend change: QR-only attendance mode

Add a `require_rfid` boolean flag to `AttendanceSession` (default `True`). When `False`, `QRScanView` marks the student present on QR scan alone, without requiring an RFID scan.

```python
# In AttendanceSession model:
require_rfid = models.BooleanField(default=True)
```

Update `QRScanView._mark_attendance_if_complete` to honour this flag.

Update `AttendanceSessionSerializer` to include the new field.

---

### 5.7 Attendance Update Request Mismatch

**Frontend request object** (stored in `localStorage`):
```js
{
  id, teacherId, teacherName, department,
  batch, program, course, attendanceType, slots, reason,
  status: "Pending", createdAt
}
```

**Backend `UpdateAttendanceRequest` model:**
```python
teacher    (FK → Teacher)
student    (FK → Student)   # ← Frontend does NOT link to a specific student
course     (FK → Course)    # ← Frontend sends course code string, not FK
classes_to_add              # ← Frontend sends "slots" (a count), not a list of class names
reason, status
```

**Gaps:**
- The frontend attendance update request links only to a teacher, not a specific student — the backend requires a specific student FK.
- The frontend sends `course` as a code string (`"CS301"`); the backend needs the integer `course_id`.
- The frontend sends `slots` (number of sessions to add); the backend expects `classes_to_add` as a string list of class identifiers.

**Recommended resolution:**

1. **Backend change:** Make `student` nullable on `UpdateAttendanceRequest` (or add a `batch`+`program` bulk-request variant that creates individual records per enrolled student on approval).
2. **Frontend change:** When submitting an attendance request, first call `GET /api/courses/?course_code=CS301` (or add a `code` field to the `Course` model for lookup) to resolve the course FK.
3. **Frontend change:** Replace localStorage-based `addAttendanceRequest` / `getAttendanceRequests` with calls to `POST /api/update-attendance-requests/` and `GET /api/update-attendance-requests/?status=pending`.
4. **Admin Dashboard change:** Replace localStorage reads with `GET /api/update-attendance-requests/` and wire approve/reject buttons to `POST /api/update-attendance-requests/{id}/approve/` and `.../reject/`.

---

### 5.8 Course Model — Missing `code` Field

The backend `Course` model only has:
```python
course_id, course_name
```

The frontend identifies courses by `code` (e.g., `"CS301"`) throughout.

**Required backend change:**

Add `course_code` (unique, CharField) to `Course` model and migration:

```python
class Course(models.Model):
    course_id   = models.AutoField(primary_key=True)
    course_name = models.CharField(max_length=200)
    course_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
```

Update `CourseSerializer` to include `course_code`.

---

### 5.9 StudentCourse — Attendance Count vs. Session Dates

**Frontend:** each course shows numeric `attendance`, `present`, `total` values.

**Backend:** `StudentCourse.classes_attended` is a comma-separated string of session dates (`"2025-11-01, 2025-11-08, ..."`), and `TaughtCourse.classes_taken` is similarly formatted.

**Required backend change:**

Extend the `StudentCourseSerializer` (or the new `/api/students/me/` endpoint) to compute and return:
```json
{
  "course_code": "CS301",
  "course_name": "Database Management Systems",
  "classes_attended_count": 28,
  "total_classes": 40,
  "attendance_percentage": 70.0
}
```

This requires `TaughtCourse.classes_taken` to be kept up-to-date as teachers start/stop sessions. The simplest approach is to increment a counter on `TaughtCourse` each time an `AttendanceSession` is stopped.

---

### 5.10 EventAdmin System — No Backend Support

The `EventAdminDashboard.jsx` manages events with participants and attendance, but there are **no corresponding models or endpoints** in the backend.

**Required backend changes (new feature):**

1. Create an `Event` model:
   ```python
   class Event(models.Model):
       title, venue, date, reg_start, reg_end, description
       registration_link
       created_by (FK → Management)
   ```
2. Create a `Participant` model:
   ```python
   class Participant(models.Model):
       event (FK → Event)
       name, email, phone
   ```
3. Create an `EventAttendance` model:
   ```python
   class EventAttendance(models.Model):
       event (FK → Event)
       participant (FK → Participant)
       status, scanned_at
   ```
4. Expose REST endpoints: `/api/events/`, `/api/events/{id}/participants/`, `/api/events/{id}/attendance/`.
5. Decide on `EventAdmin` role: either add it as a separate user type (new model) or fold it into the existing `Management` model with a role flag.

**Note:** The frontend's `SignUp.jsx` already has an `eventAdmin` role selection. If the backend `Management` model is extended with a `role` field (`university_admin` / `event_admin`), minimal changes are needed.

---

### 5.11 Signup Page

`SignUp.jsx` currently saves to `localStorage` only. There are three roles: `admin`, `eventAdmin`, `participant`.

**Required frontend changes:**

- `admin` signup → `POST /api/auth/register/management/`
- `eventAdmin` signup → same endpoint, with an `event_admin` role discriminator once the backend supports it.
- `participant` signup → once the Event backend is built, map to `POST /api/participants/`.
- Remove all `localStorage` writes after successful registration.

---

### 5.12 Missing "Me" / Profile Endpoints

The frontend needs to fetch the currently authenticated user's own data without knowing their database ID in advance. The backend currently has no `/me` endpoint.

**Required backend additions:**

| Endpoint | Returns |
|----------|---------|
| `GET /api/students/me/` | Authenticated student profile + courses + attendance stats |
| `GET /api/teachers/me/` | Authenticated teacher profile + taught courses + batch/program info |
| `GET /api/management/me/` | Authenticated manager profile |

Implementation approach: override `get_object` in the respective `ViewSet` to filter by `request.user`:
```python
@action(detail=False, methods=['get'])
def me(self, request):
    student = get_object_or_404(Student, user=request.user)
    serializer = StudentDetailSerializer(student)
    return Response(serializer.data)
```

---

### 5.13 Frontend API Service Layer (New File)

To avoid scattering `fetch`/`axios` calls throughout components, create a dedicated API service module:

```
FYDP-frontend/src/api/
  index.js        ← Axios instance with base URL and auth interceptor
  auth.js         ← login, register, refresh token
  students.js     ← getMyProfile, getCourses, submitQRScan
  teachers.js     ← getMyProfile, startSession, stopSession, getQRCode
  admin.js        ← getStudents, getTeachers, getRequests, approveRequest, rejectRequest
  events.js       ← getEvents, createEvent, getParticipants (future)
```

Suggested Axios configuration in `src/api/index.js`:
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // Attempt token refresh
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        const { data } = await axios.post('/api/token/refresh/', { refresh });
        localStorage.setItem('access_token', data.access);
        err.config.headers.Authorization = `Bearer ${data.access}`;
        return axios(err.config);
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

Install Axios:
```bash
npm install axios
```

---

## 6. Summary of All Required Changes

### 6.1 Backend Changes

| # | File(s) | Change | Priority |
|---|---------|--------|----------|
| B1 | `requirements.txt`, `settings.py` | Add `django-cors-headers`; configure `CORS_ALLOWED_ORIGINS` | **Critical** |
| B2 | `FYP_Backend/urls.py` | Add SimpleJWT token-refresh URL | High |
| B3 | `core/models.py` | Add `department` to `Teacher`; add `course_code` to `Course`; add `department` to `Management` | High |
| B4 | `core/models.py` | Add `program` field to `TaughtCourse` | High |
| B5 | `core/models.py` | Add `latitude`, `longitude`, `radius_meters`, `require_rfid` to `AttendanceSession` | High |
| B6 | `core/views.py` | Add `/api/students/me/`, `/api/teachers/me/`, `/api/management/me/` endpoints | High |
| B7 | `core/views.py`, `core/serializers.py` | Update `StudentCourseSerializer` / `/me` endpoint to return computed attendance counts | High |
| B8 | `core/views.py` | Update `QRScanView` to support QR-only mode (when `require_rfid=False`) | High |
| B9 | `core/models.py`, `core/views.py`, `core/serializers.py`, `core/urls.py` | Make `student` nullable on `UpdateAttendanceRequest`; add batch/program fields to support frontend's bulk request style | Medium |
| B10 | `core/models.py`, `core/views.py`, `core/serializers.py`, `core/urls.py` | Create `Event`, `Participant`, `EventAttendance` models and REST endpoints | Medium |
| B11 | `core/models.py` | Add `role` discriminator to `Management` for `university_admin` vs `event_admin` | Medium |
| B12 | Run `python manage.py makemigrations && python manage.py migrate` after all model changes | — | Required |

### 6.2 Frontend Changes

| # | File(s) | Change | Priority |
|---|---------|--------|----------|
| F1 | `src/api/index.js` *(new)* | Create Axios instance with base URL + auth interceptor + refresh logic | **Critical** |
| F2 | `src/api/auth.js` *(new)* | `loginStudent`, `loginTeacher`, `loginManagement`, `register*` functions | **Critical** |
| F3 | `src/pages/Login.jsx` | Replace static credential checks with API calls; store JWT tokens in `localStorage` | **Critical** |
| F4 | `src/pages/StudentDashboard.jsx` | Replace `StudentData.js` import with `GET /api/students/me/`; map API fields to component state | High |
| F5 | `src/pages/TeacherDashboard.jsx` | Replace `TeacherData.js` import with `GET /api/teachers/me/`; call `POST /api/attendance-sessions/` instead of local QR generation | High |
| F6 | `src/components/GenerateQRCode.jsx` | Change QR value from full JSON payload to the backend `qr_code_token` string | High |
| F7 | `src/pages/StudentDashboard.jsx` | After decoding QR, call `POST /api/attendance/qr-scan/` with `{ qr_token, student_id }` | High |
| F8 | `src/pages/AdminDashboard.jsx` | Replace `adminData.*` with API calls to `/api/students/`, `/api/teachers/`, `/api/update-attendance-requests/` | High |
| F9 | `src/components/admin/AttendenceRequest.jsx` | Wire approve/reject to `POST /api/update-attendance-requests/{id}/approve/` and `.../reject/` | High |
| F10 | `src/pages/SignUp.jsx` | Replace `localStorage` writes with API registration calls | High |
| F11 | `src/App.jsx` | Remove `initStudents()` / `initTeachers()` localStorage seeding | Medium |
| F12 | `src/data/*.js` | Keep files as fallback/mock data during development; remove all runtime imports once API is wired | Medium |
| F13 | `src/pages/EventAdminDashboard.jsx` | Wire to Event API endpoints once backend is ready | Low |
| F14 | `package.json` | Add `axios` dependency | Required for F1–F13 |
| F15 | `vite.config.js` | Add `VITE_API_URL` env variable support (or a dev proxy to `localhost:8000`) | Required |

---

## 7. Recommended Integration Order

1. **Backend:** Enable CORS (B1) — unblocks all frontend-backend communication.
2. **Backend:** Add token-refresh URL (B2).
3. **Frontend:** Create API service layer (F1, F14, F15).
4. **Frontend:** Wire login to backend (F2, F3) — establishes the auth foundation.
5. **Backend:** Add `/me` endpoints (B6) — enables authenticated dashboard data loading.
6. **Backend:** Add model fields (`department`, `course_code`, `program`, `require_rfid`) + migrate (B3–B5, B12).
7. **Frontend:** Wire Student Dashboard to API (F4, F7) — replace localStorage for students.
8. **Frontend:** Wire Teacher Dashboard + QR session flow to API (F5, F6) — attendance session lifecycle.
9. **Frontend:** Wire Admin Dashboard to API (F8, F9) — attendance requests and user management.
10. **Frontend:** Wire Signup page to API (F10); remove seeding (F11).
11. **Backend + Frontend:** Build Event system (B10, B11, F13).

---

## 8. Data Field Mapping Reference

### Student

| Frontend field | Backend field | Notes |
|----------------|--------------|-------|
| `profile.name` | `student_name` | Rename on frontend |
| `profile.studentId` | `student_id` | Use as integer |
| `profile.year` | `year` | Backend: int (academic level 1–4); Frontend: string batch year ("2023"). Clarify semantics. |
| `profile.section` | `section` | Same |
| `profile.department` | `dept` | Backend: short code; Frontend: full name. Standardise. |
| `email` | `email` | Same |
| `overallAttendance.percentage` | `overall_attendance` | Same (Float) |
| `courses[].code` | `course_code` *(new)* | Add to backend Course model |
| `courses[].name` | `course_name` | Same |
| `courses[].present` | Computed from `classes_attended` | Count comma-separated dates |
| `courses[].total` | Computed from `TaughtCourse.classes_taken` | Count comma-separated entries |
| `courses[].attendance` | Computed: `present/total * 100` | Calculated server-side |

### Teacher

| Frontend field | Backend field | Notes |
|----------------|--------------|-------|
| `profile.name` | `teacher_name` | Rename |
| `profile.teacherId` | `teacher_id` | Use as integer |
| `profile.department` | `department` *(new)* | Add to Teacher model |
| `profile.coursesTeaching` | Derived from `TaughtCourse` FK list | Build as array of course codes |
| `batches` | Derived from `TaughtCourse.year` | Return distinct years from teacher's courses |
| `programs` | `TaughtCourse.program` *(new)* | Add to TaughtCourse model |
| `attendanceTypes` | Static list or new model | Could be configurable per institution |
| `courses[].code` | `course_code` *(new)* | From `Course` model |
| `courses[].name` | `course_name` | Same |

### Attendance Session

| Frontend concept | Backend field | Notes |
|-----------------|--------------|-------|
| Selected batch | `AttendanceSession.year` | Map batch year string to integer level |
| Selected program | `AttendanceSession` *(new program field)* | Add via B4 |
| Selected course (code) | `AttendanceSession.course` (FK) | Resolve code → ID before POST |
| Selected type ("Lecture"/"Lab") | Not in session model | Could add `session_type` CharField |
| Selected slots | Not in session model | Could add `total_slots` IntegerField |
| Geolocation | `latitude`, `longitude`, `radius_meters` *(new)* | Send from teacher on session creation |
| QR value | `qr_code_token` | Use as QR content |

---

## 9. Security Considerations

1. **Never store plain-text passwords in JavaScript files** — the current `TeacherData.js`, `AdminData.js`, and `StudentData.js` contain passwords. Remove them once the API auth is live.
2. **JWT tokens in `localStorage`** are susceptible to XSS. Consider `httpOnly` cookies for production. For the current scope, `localStorage` is acceptable during development.
3. **CORS**: Restrict `CORS_ALLOWED_ORIGINS` to only the frontend origin in production.
4. **Django `DEBUG = True`** and the hard-coded `SECRET_KEY` in `settings.py` must be changed before any production deployment. Use environment variables.
5. **RFID endpoint (`POST /api/attendance/rfid-scan/`) is `AllowAny`** — this is intentional for hardware integration, but should be restricted to the hardware's IP or use a shared secret in production.

---

## 10. Files to Create / Modify

### New files (Frontend)
- `FYDP-frontend/src/api/index.js`
- `FYDP-frontend/src/api/auth.js`
- `FYDP-frontend/src/api/students.js`
- `FYDP-frontend/src/api/teachers.js`
- `FYDP-frontend/src/api/admin.js`
- `FYDP-frontend/src/api/events.js`
- `FYDP-frontend/.env.development` (for `VITE_API_URL`)

### Modified files (Frontend)
- `FYDP-frontend/package.json` — add `axios`
- `FYDP-frontend/vite.config.js` — optional proxy config
- `FYDP-frontend/src/pages/Login.jsx`
- `FYDP-frontend/src/pages/SignUp.jsx`
- `FYDP-frontend/src/pages/StudentDashboard.jsx`
- `FYDP-frontend/src/pages/TeacherDashboard.jsx`
- `FYDP-frontend/src/pages/AdminDashboard.jsx`
- `FYDP-frontend/src/components/GenerateQRCode.jsx`
- `FYDP-frontend/src/components/admin/AttendenceRequest.jsx`
- `FYDP-frontend/src/App.jsx`

### New files (Backend)
- `FYP_Backend-main/core/migrations/XXXX_add_cors_fields.py` *(auto-generated)*

### Modified files (Backend)
- `FYP_Backend-main/requirements.txt` — add `django-cors-headers`
- `FYP_Backend-main/FYP_Backend/settings.py` — CORS config
- `FYP_Backend-main/FYP_Backend/urls.py` — token-refresh URL
- `FYP_Backend-main/core/models.py` — new fields
- `FYP_Backend-main/core/serializers.py` — updated serializers + new detail serializers
- `FYP_Backend-main/core/views.py` — `/me` endpoints, QR-only mode, geo-validation
- `FYP_Backend-main/core/urls.py` — `/me` routes
