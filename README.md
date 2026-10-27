# Healix 🏥

Healix is a web-based School Clinic Management System designed to streamline the management of student health services. It allows school staff to efficiently track medical records, appointments, and clinic inventory while providing better care to students.

Features

- Student Medical Profiles: Keep detailed records of student health history and current conditions.
- Appointments & Queue Management: Schedule and manage student visits efficiently.
- Inventory Management: Track medicines, supplies, and equipment in the clinic.
- Staff Roles & Access Control: Assign different roles to staff members for better organization.
- Reports & Analytics: Generate reports to monitor student health trends and clinic activities.

## How it fits together

- `app/` is the frontend: React Router 7, React 19 and Tailwind, built with Vite.
- `backend/` is the API: Flask on SQLite. Routes live in `controllers/`, SQL in `models/`.
- The browser logs in with `POST /validateuser` and sends the returned token as
  `Authorization: Bearer <token>` on every other request.

## Running it locally

You need Python 3.12+ and Node 20+.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
python setup_db.py             # first time only: creates db/clinic.db and an admin account
```

Then start it, with a secret of your own:

```bash
# PowerShell
$env:HEALIX_SECRET = python -c "import secrets; print(secrets.token_urlsafe(48))"
python app.py
```

The API listens on http://127.0.0.1:5000.

### Frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173 and log in with the admin account from `setup_db.py`.

## Configuration

| Variable | Where | What it does |
| --- | --- | --- |
| `HEALIX_SECRET` | backend, **required** | Signs login tokens. The server will not start without it. Keep it secret and keep it the same across restarts, or everyone is logged out. |
| `HEALIX_ALLOWED_ORIGINS` | backend | Comma-separated frontend URLs allowed to call the API. Defaults to the local dev servers. Set it to your real frontend URL in production. |
| `HEALIX_TRUST_PROXY` | backend | Set to `1` only behind a reverse proxy (Railway, nginx), so the real client IP is used for login throttling and the audit log. |
| `HEALIX_DB` | backend | Path to the clinic database. Defaults to `backend/db/clinic.db`. |
| `HEALIX_STUDENT_DB` | backend | Path to the student registry database. Defaults to `backend/db/students.db`. |
| `VITE_API_URL` | frontend, at build time | The API's address. Defaults to `http://127.0.0.1:5000`. |

## Roles

| Role | Can do |
| --- | --- |
| Staff | Everything except saving visit records and medications, adding staff, and reading the audit log |
| Nurse, Doctor | Everything Staff can, plus saving visit records and medications |
| Admin | Everything, including adding staff and reading the audit log |

Every API route must be listed in `ROUTE_ROLES` in `backend/roles.py`. A route that is not
listed is refused for every role, and the server prints a warning at startup naming it.

## Data and privacy

The databases hold student health records and staff passwords. They are listed in
`.gitignore` and must never be committed. To share the table structure, update
`backend/db/schema.sql` instead.

## Tests

```bash
cd backend
python -m pytest
```

The tests build a throwaway database from `db/schema.sql` with made-up data. They never
touch `db/clinic.db`.

## Deploying

- **Backend:** `backend/Procfile` runs the API with waitress. Set `HEALIX_SECRET`,
  `HEALIX_ALLOWED_ORIGINS` and, behind a proxy, `HEALIX_TRUST_PROXY=1`. Keep the database
  on persistent storage and point `HEALIX_DB` at it.
- **Frontend:** build with `VITE_API_URL` set, then run `npm start`, or use the `Dockerfile`.
