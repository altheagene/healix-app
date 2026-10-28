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

## Tests and checks

```bash
cd backend
python -m pytest          # tests
python -m ruff check .    # lint
```

The tests build a throwaway database from `db/schema.sql` with made-up data. They never
touch `db/clinic.db`.

For the frontend:

```bash
npm run typecheck
npm run lint
```

CI runs all of these, plus a production build, on every push.

## Backups

```bash
cd backend
python backup_db.py
```

This copies the database to `backend/backups/` while the server keeps running, and keeps
the 14 newest copies (`HEALIX_BACKUPS_TO_KEEP` changes that; `HEALIX_BACKUP_DIR` changes
where they go). Run it daily with Windows Task Scheduler or cron, and copy the backups
somewhere other than the server itself. Backups contain patient data: store them as
carefully as the database.

## Deploying

### Frontend: Vercel

Import the repository in Vercel; it detects React Router. Set `VITE_API_URL` to the API's
public address in the project's environment variables, then deploy. The Vercel preset in
`react-router.config.ts` switches on automatically during Vercel builds.

### Backend: a host with a persistent disk

The API keeps its data in a SQLite file, so it needs a server whose disk survives
restarts. Vercel's Python functions do not have one: the database would be lost.
Any small VM or a platform with persistent volumes works (for example Railway or Render
with a volume, or Fly.io). `backend/Procfile` starts it with waitress. Set:

- `HEALIX_SECRET`, a long random value
- `HEALIX_ALLOWED_ORIGINS`, your Vercel URL, e.g. `https://healix.vercel.app`
- `HEALIX_TRUST_PROXY=1`, as these platforms put a proxy in front
- `HEALIX_DB`, pointing at the persistent volume, e.g. `/data/clinic.db`

Then run `python setup_db.py` once on the server, and schedule `python backup_db.py`.
