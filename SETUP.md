# Local Setup & Run Guide

This guide explains how to run the full Smart Attendance Management System on your local machine.

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12 or higher |
| Node.js | 18 or higher |
| npm | 9 or higher |
| PostgreSQL *(optional)* | 14 or higher |

> **SQLite default** — by default the backend uses an SQLite file (`db.sqlite3`) so you can run everything without installing PostgreSQL. Set `USE_SQLITE=False` in your environment to switch to PostgreSQL.

---

## 1 — Backend Setup (Django)

### 1.1 Clone / enter the backend directory
```bash
cd FYP_Backend-main
```

### 1.2 Create and activate a virtual environment
```bash
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows
venv\Scripts\activate
```

### 1.3 Install Python dependencies
```bash
pip install -r requirements.txt
```

All required packages are listed in `requirements.txt`:
```
Django==5.2.8
psycopg2-binary==2.9.11
djangorestframework==3.16.1
djangorestframework-simplejwt==5.5.1
django-cors-headers==4.9.0
qrcode==8.0
Pillow==11.0.0
```

### 1.4 Apply database migrations
```bash
python manage.py migrate
```

This creates all tables including the new Event, EventParticipant, EventRegistration, and EventAttendance tables.

### 1.5 (Optional) Create a Django superuser
```bash
python manage.py createsuperuser
```

### 1.6 Run the development server
```bash
python manage.py runserver
```

The API is now available at **http://localhost:8000/api/**.

#### Environment variables (optional overrides)

| Variable | Default | Purpose |
|----------|---------|---------|
| `USE_SQLITE` | `True` | Set to `False` to use PostgreSQL instead |
| `SECRET_KEY` | hardcoded dev key | Override in production |
| `DEBUG` | `True` | Set to `False` in production |

Example for PostgreSQL:
```bash
USE_SQLITE=False python manage.py runserver
```

If `USE_SQLITE=False`, configure `FYP_Backend/settings.py` with your PostgreSQL credentials:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'school_db',
        'USER': 'dbuser',
        'PASSWORD': 'dbpass',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## 2 — Frontend Setup (React / Vite)

### 2.1 Enter the frontend directory
```bash
cd FYDP-frontend
```

### 2.2 Install JavaScript dependencies
```bash
npm install --ignore-scripts
```

> `--ignore-scripts` is used because one optional dev dependency (`ngrok`) tries to download a binary at install time. Using this flag skips that download — all application code still works normally.

### 2.3 Configure the API URL (optional)
Create or edit `.env.development` in `FYDP-frontend/`:
```
VITE_API_URL=http://localhost:8000/api
```
This is already present and set to the default. Change it if your backend runs on a different host or port.

### 2.4 Start the development server
```bash
npm run dev
```

The app is now available at **http://localhost:5173/**.

---

## 3 — Running Both Together

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd FYP_Backend-main
source venv/bin/activate   # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd FYDP-frontend
npm run dev
```

Then open **http://localhost:5173/** in your browser.

---

## 4 — Running Tests

### Backend tests
```bash
cd FYP_Backend-main
source venv/bin/activate
python manage.py test core
```

All 100 tests run against an in-memory SQLite database — no PostgreSQL required.

To run a specific test class:
```bash
python manage.py test core.tests.EventManagementTestCase
python manage.py test core.tests.MeEndpointTestCase
python manage.py test core.tests.QROnlyAttendanceTestCase
```

---

## 5 — Quick API Reference

### Authentication

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/student/` | Register student |
| POST | `/api/auth/register/teacher/` | Register teacher |
| POST | `/api/auth/register/management/` | Register admin/event-admin |
| POST | `/api/auth/register/participant/` | Register event participant |
| POST | `/api/auth/login/student/` | Student login → JWT tokens |
| POST | `/api/auth/login/teacher/` | Teacher login → JWT tokens |
| POST | `/api/auth/login/management/` | Admin login → JWT tokens |
| POST | `/api/auth/login/participant/` | Participant login → JWT tokens |
| POST | `/api/token/refresh/` | Refresh access token |

### Profile ("me") Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/students/me/` | Authenticated student's profile + course attendance |
| GET | `/api/teachers/me/` | Authenticated teacher's profile + taught courses |
| GET | `/api/management/me/` | Authenticated admin's profile |
| GET | `/api/event-participants/me/` | Authenticated participant's profile |

### Attendance

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/attendance-sessions/` | Teacher starts a session |
| POST | `/api/attendance-sessions/{id}/stop/` | Teacher stops a session |
| GET | `/api/attendance-sessions/{id}/qr/` | Get base64 QR image |
| GET | `/api/attendance-sessions/{id}/attendance/` | Get records + stats |
| POST | `/api/attendance/rfid-scan/` | RFID hardware scan (no auth required) |
| POST | `/api/attendance/qr-scan/` | Student QR scan (JWT required) |

### Events

| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/events/` | List / create events |
| GET | `/api/events/{id}/registrations/` | List event registrations |
| GET | `/api/events/{id}/attendance/` | Event attendance statistics |
| POST | `/api/events/{id}/mark-attendance/` | Mark participant present |
| POST | `/api/event-registrations/` | Register participant for event |

### Attendance Update Requests

| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/update-attendance-requests/` | List / create requests |
| POST | `/api/update-attendance-requests/{id}/approve/` | Admin approves |
| POST | `/api/update-attendance-requests/{id}/reject/` | Admin rejects |

Use `Authorization: Bearer <access_token>` header for all protected endpoints.

---

## 6 — Building for Production

### Frontend
```bash
cd FYDP-frontend
npm run build
```
Output is in `FYDP-frontend/dist/`. Serve it with any static file server (Nginx, Apache, `serve`, etc.).

### Backend
Set the following before deploying:
```bash
export SECRET_KEY="your-long-random-secret-key"
export DEBUG=False
export USE_SQLITE=False   # use PostgreSQL in production
```
Then run with Gunicorn:
```bash
pip install gunicorn
gunicorn FYP_Backend.wsgi:application --bind 0.0.0.0:8000
```

Update `CORS_ALLOWED_ORIGINS` in `settings.py` to include your production frontend URL.
