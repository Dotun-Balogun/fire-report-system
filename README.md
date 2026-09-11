# Online Fire Disaster Report Management System
### Plateau State Fire Service — Final Year Project

This is the working implementation that accompanies Chapters One to Three of the
project report. It is built with **Next.js 16** (App Router, TypeScript),
**Tailwind CSS v4**, hand-written shadcn-style components, and **Supabase**
(PostgreSQL, Auth, Storage, Realtime), package-managed with **pnpm**, and
deployable to **Vercel**.

This README is written for someone setting the project up for the **first
time**, with no assumed prior experience with Supabase — it is meant to be
usable by a supervisor, examiner, or classmate, not just the original
developer.

---

## 1. What this system does (and how it maps to the report)

| Chapter 1 objective | Where it's implemented |
|---|---|
| Centralized, cloud-hosted database for incidents, stations, and response records | Supabase PostgreSQL — see `supabase/schema.sql` |
| Web-based platform for citizens to report fire disasters in real time | `/` — the public report form (`components/report/report-form.tsx`) |
| Secure administrator/dispatcher interface to review, verify, and act on reports | `/admin` — gated by `proxy.ts`, live dashboard in `components/admin/incident-board.tsx` |
| Reporters can track a report's status from receipt to resolution | `/track/[code]` — public, no login required, polls live status |
| Improve transparency and accountability | Every status change is visible to the reporter immediately; CSV export gives an auditable record |
| Minimize delays and human error | Automatic GPS capture, automatic nearest-station assignment (Postgres trigger), realtime dashboard alerts |

This also directly answers the **Statement of the Problem** (Chapter 1.2):
manual, phone-based reporting was slow, error-prone, gave reporters no
visibility into what happened next, and left management without usable
records. Each of those four problems has a corresponding feature above.

### Modules from Chapter 3.4.2, and where each one lives

- **Citizen Reporter Registration and Authentication Module** → `/account`
  (optional — see design note below)
- **Incident Reporting Module** → `/` (home page)
- **Administrator and Dispatcher Module** → `/admin`
- **Fire Station and Personnel Management Module** → `/admin/stations`
  (station management is complete; responder/personnel CRUD is a documented
  next iteration — see §7)
- **Incident Status Tracking Module** → `/track/[code]`
- **Notification Module** → realtime push to the dispatcher dashboard the
  instant a report is filed (see design note below)
- **Report Generation Module** → CSV export is implemented on `/admin`;
  PDF/Excel are a documented next iteration (§7)
- **Database Module** → `supabase/schema.sql`

### Design note: why reporting doesn't require login

Chapter 3 describes citizens "registering or signing in" before reporting.
In the implementation, this is deliberately **optional, not mandatory**: the
moment anyone opens the site, they're silently given an anonymous Supabase
Auth session (no form, no password) — that's what Row-Level Security uses to
make sure only they (and staff) can see their own report. This satisfies the
same requirement (every report is tied to an authenticated identity) without
putting a signup form between a person and reporting a fire, which would
contradict the report's own stated aim of minimizing delay under duress.

A citizen can optionally visit `/account` to turn that anonymous session into
a real email/password account (all their past reports carry over, since the
underlying user id doesn't change) — this is what fulfils the "Registration
and Authentication Module" as a genuine, working feature rather than a forced
gate.

### Design note: what "Notification Module" means here

There is no SMS/email gateway wired up (that would need a paid third-party
service and a real phone number/SMTP domain, out of scope for a student
budget). Instead, the notification is a **Supabase Realtime** push: the
instant a citizen submits a report, it appears on every open dispatcher
dashboard immediately, with no page refresh. This is the same underlying
requirement (the fire station is notified without anyone having to check
manually) implemented with infrastructure that's actually free to run.

---

## 2. Prerequisites

You need three things installed, and one free account:

1. **Node.js 22 or later** — https://nodejs.org (download the LTS installer)
2. **pnpm** — after installing Node, run:
   ```bash
   corepack enable
   corepack prepare pnpm@10.15.0 --activate
   ```
3. **A code editor** — VS Code is recommended: https://code.visualstudio.com
4. **A free Supabase account** — https://supabase.com → "Start your project"

---

## 3. Create your Supabase project

1. In the Supabase dashboard, click **New Project**. Pick any name/region and
   set a database password (save it somewhere — you likely won't need it
   again, but keep it safe).
2. Wait about two minutes for the project to finish provisioning.
3. Go to **Project Settings → Data API**. Copy:
   - **Project URL**
   - **anon / publishable key**
   (You'll paste both into `.env.local` in the next step.)
4. Go to **Authentication → Sign In / Providers → Anonymous** and toggle it
   **on**, then save. This is required — the whole "no login needed to
   report" flow depends on it.

---

## 4. Set up the project on your computer

```bash
# unzip / clone the project, then:
cd fire-report-system
pnpm install

cp .env.local.example .env.local
```

Open `.env.local` and paste in the two values from Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## 5. Set up the database

1. In the Supabase dashboard, open the **SQL Editor** (left sidebar).
2. Open `supabase/schema.sql` from this project, copy its entire contents,
   paste into a new SQL Editor query, and click **Run**.
3. This single script creates every table, security policy, storage bucket,
   and the two database functions the app depends on, and inserts two sample
   fire stations so the dashboard isn't empty on first run.

### Create your first staff (admin) login

The schema script doesn't create a staff account for you — that's a manual,
deliberate step so nobody can guess their way into the admin dashboard.

1. In Supabase: **Authentication → Users → Add user** (create with an email
   and password you'll remember — email confirmation can be switched off for
   this one user, or just confirm it manually).
2. Copy that user's **UID** from the users list.
3. Back in the **SQL Editor**, run (replacing the placeholders):
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('paste-the-uid-here', 'Your Full Name', 'admin');
   ```
4. You can now sign in at `/admin/login` with that email/password.

---

## 6. Run it

```bash
pnpm dev
```

- **Report a fire:** http://localhost:3000
- **Staff dashboard:** http://localhost:3000/admin
- **My reports (optional citizen account):** http://localhost:3000/account

Try it end-to-end: submit a report on the home page (allow location access
when your browser asks), copy the tracking code you're redirected to, then
open `/admin` in another browser/incognito window signed in as staff — the
report should already be sitting there, live, with a nearest station
auto-assigned.

### Regenerating database types (optional, but recommended)

Severity and status are real Postgres **ENUM types** (not just `text` with a
check constraint) specifically so that Supabase's own type generator can
produce a proper literal-union type for them. Types are split into two files:

- `types/supabase-generated.types.ts` — a stand-in for what
  `supabase gen types` outputs. Safe to overwrite/regenerate anytime.
- `types/database.types.ts` — a small, stable adapter that the rest of the
  app actually imports from. It re-exports `Database` and derives the
  `Severity` / `IncidentStatus` convenience types from the generated `Enums`.
  **You never need to edit this file, and regenerating the file above never
  breaks an import anywhere else in the app.**

Once your project is linked, get the real, guaranteed-accurate types with:

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref your-project-ref
pnpm gen:types
```

---

## 7. What's implemented vs. what's a documented next step

Consistent with the Agile methodology described in Chapter 3.1.1 (build,
test, and stabilize one module before moving to the next), everything listed
under "Done" below is fully working, not a mockup.

**Done:** incident reporting, photo capture/upload, GPS + landmark location,
anonymous + optional registered auth, nearest-station auto-assignment,
realtime dispatcher dashboard, public status tracking, fire station
management, analytics dashboard, CSV export.

**Documented next iteration:**
- Personnel/responder CRUD in `/admin/stations` (the `incident_assignments`
  table and its RLS policies already exist in the schema — only the admin UI
  to assign a specific responder to a report is left to build).
- PDF and Excel export (CSV is implemented; PDF would use `pdf-lib`, Excel
  would use a library like `exceljs`).
- Real SMS/email notification integration (currently realtime-dashboard-only,
  see §1).

---

## 8. Why severity/status are Postgres ENUM types

An earlier version of this schema used plain `text` columns with a `check`
constraint for `severity` and `status`. That looks equivalent, but the
Supabase type generator can only produce a literal-union TypeScript type
(`"small" | "spreading" | "major"`) from a real Postgres `ENUM` — from
`text + check` it only sees `string`, which silently breaks every place in
the app that relies on the literal type (e.g. `<Badge variant={status}>`,
the severity selector) the moment you regenerate types. Using real `ENUM`
types (see `supabase/schema.sql`) means `pnpm gen:types` produces the
correct types automatically, permanently, with no hand-written workaround
needed.

---

## 9. Deploying (optional)

The app is ready to deploy to **Vercel** (the same platform referenced
throughout the report):

1. Push this project to a GitHub repository.
2. In Vercel, "Import Project" from that repo.
3. Add the same two environment variables from `.env.local` in Vercel's
   Project Settings → Environment Variables.
4. Deploy. Vercel builds and hosts it on a public URL automatically.

---

## 10. Project structure

```
proxy.ts                        # Next.js 16's middleware.ts replacement — refreshes
                                 # the auth session and gates /admin to staff only
app/
  page.tsx                      # public report screen
  actions.ts                    # submitReport server action
  account/                      # optional citizen registration/login + "My Reports"
  track/[code]/page.tsx         # public status tracker, no login required
  admin/
    login/page.tsx
    page.tsx                    # dispatcher dashboard (live incident board)
    analytics/page.tsx          # admin analytics
    stations/page.tsx           # fire station management
    actions.ts                  # staffLogin / staffLogout / updateIncidentStatus
components/
  report/                      # severity-selector, location-field, photo-capture, report-form
  status/status-tracker.tsx    # polls the public get_incident_status() RPC
  admin/                       # incident-board (realtime), analytics-view, station-form
  nav-bar.tsx                  # shared navigation used on every page
  ui/                          # hand-written shadcn-style primitives
lib/supabase/{client,server}.ts
supabase/schema.sql            # the entire database: tables, RLS, storage, triggers
types/
  database.types.ts            # stable adapter — import from here, never below
  supabase-generated.types.ts  # regenerate freely with `pnpm gen:types` (see §6)
```

## 11. Troubleshooting

- **"Could not start a secure session" on submit** — double-check Anonymous
  Sign-ins is enabled in Supabase (§3, step 4).
- **New reports don't appear live on `/admin`** — `schema.sql` adds
  `incident_reports` to the `supabase_realtime` publication automatically;
  if you created the table a different way, run:
  `alter publication supabase_realtime add table public.incident_reports;`
- **TypeScript errors mentioning `never` or a plain `string` where a status/
  severity value is expected** — you're most likely on an old copy of
  `schema.sql` that used `text + check` instead of real `ENUM` types; pull
  the latest `schema.sql`, or see §8.
- **Location never resolves** — GPS requires a secure context; this works on
  `localhost` in development, but a production deployment must be served over
  HTTPS (Vercel does this automatically).
