# SASI Performance Dashboard

A read-mostly dashboard over Firestore for SASI Educational Institutes — branch
comparisons, exam-level breakdowns, top performers, and a Storage-driven upload
flow that hands off to a Cloud Function parser.

Built with React 18 + Vite, Tailwind, React Router v6, Firebase JS SDK v10
(modular), Recharts, lucide-react, and date-fns.

## Stack

- **React 18 + Vite** — JS, no TypeScript
- **Tailwind CSS** — utility-first styling
- **React Router v6** — routing, all filter state in `useSearchParams`
- **Firebase JS SDK v10** — Auth, Firestore, Storage (modular imports only)
- **Recharts** — charts
- **lucide-react** — icons
- **date-fns** — date formatting

## Prerequisites

- Node.js 18+ and npm
- A Firebase project with Auth (Email/Password + Google) enabled, Firestore in
  the data model documented below, and a Storage bucket reachable by the web
  client

## Install

```bash
npm install
```

## Configure

The app reads its Firebase config from environment variables that Vite injects
at build time. Real values **must not** be committed.

```bash
cp .env.example .env
# then open .env and paste your Firebase web app config
```

Required variables (all `VITE_`-prefixed so Vite exposes them to the client):

| Variable | Source in Firebase console |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Project settings → SDK setup → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | same |
| `VITE_FIREBASE_PROJECT_ID` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same |
| `VITE_FIREBASE_APP_ID` | same |

The dashboard also expects users to be **provisioned by an administrator** in
the Firebase Auth console — there is no sign-up UI.

## Run dev server

```bash
npm run dev
```

The app starts on `http://localhost:5173`. Sign in with email/password or
Google to land on the Overview page.

## Build for production

```bash
npm run build
npm run preview     # to spot-check the production build locally
```

The bundle is emitted to `dist/`. Deploy `dist/` behind any static host (Firebase
Hosting, Netlify, S3+CloudFront, etc.).

## Routes

| Route | Page |
| --- | --- |
| `/login` | Email/password + Google sign-in |
| `/` | Overview (KPIs, latest branch chart, recent uploads) |
| `/branches` | Branch comparison table + 5-exam grouped chart |
| `/programs` | Per-program cards |
| `/exams` | Filterable, paginated exam list |
| `/exams/:examId` | Exam detail (branch ranking, subject avgs, top 30, CSV) |
| `/students` | Top performers, filterable by program/branch/exam |
| `/students/:studentCode` | Student trend, all results, subject avgs |
| `/upload` | Drag-and-drop .xlsx upload to Firebase Storage |
| `*` | 404 |

All routes except `/login` are wrapped in a `ProtectedRoute` that redirects to
`/login` when no user is authenticated.

## Firestore data model

The dashboard reads (does not write) these collections. The schema is fixed —
the frontend never invents fields.

```
branches/{code}              { name, region, student_count }
programs/{code}              { name, stream, level }
students/{code}              { name, gender, branch, section, program, class, academic_year }
exams/{program_name_date}    { name, format, date, max_marks, class_code, program,
                                student_count, branches_appeared[] }
exam_results/{code_examId}   { student_code, branch, exam_id, total_marks,
                                percentage, grade, *_rank, subjects, is_absent, ... }
dashboard_aggregates/{examId} { exam_name, exam_date, branch_stats, top_30_students,
                                overall_avg, total_students }
upload_log/{auto}            { file_name, uploaded_by, uploaded_at, rows_processed,
                                status, error_log }
```

### Read strategy

- **Dashboard pages prefer `dashboard_aggregates`.** The aggregate doc holds
  per-branch counts, distribution buckets, top-30, subject averages — anything a
  page needs without touching `exam_results`.
- **`exam_results` is queried only for per-student data** (Top Performers and
  the Student Detail page).
- **`onSnapshot` is reserved for upload status.** Everything else uses
  one-time `getDoc` / `getDocs` reads.

## Project layout

```
src/
  main.jsx                  Vite entry; wraps the app in <BrowserRouter>
  App.jsx                   Renders <AppRoutes />
  routes.jsx                All route definitions
  firebase.js               Firebase init; exports auth, db, storage
  components/               Layout, Sidebar, Header, ProtectedRoute, KpiCard,
                            BranchBarChart, DistributionChart, StudentTable,
                            FilterBar, LoadingSpinner, EmptyState
  pages/                    One file per route
  hooks/                    useAuth, useFirestoreDoc, useFirestoreQuery
  lib/                      queries.js (all Firestore reads), formatters.js,
                            constants.js (branch list, colors, page size)
  styles/index.css          Tailwind directives
```

All Firestore queries live in `src/lib/queries.js`. Pages call those functions
rather than touching `db` directly so the schema is changeable in one place.

## Upload flow

1. User drops an `.xlsx` on `/upload`.
2. The client uploads to `uploads/{timestamp}_{filename}` in Storage with
   resumable progress (`uploadBytesResumable`).
3. A separate Cloud Function (out of scope for this repo) is triggered by the
   Storage upload, parses the spreadsheet, writes to `exam_results` and
   `dashboard_aggregates`, then writes a row to `upload_log`.
4. The page subscribes (`onSnapshot`) to the matching `upload_log` row by file
   name + timestamp, and surfaces `PROCESSING` → `SUCCESS` / `FAILED`.

The frontend does **not** parse Excel itself.

## Conventions

- Filter state lives in URL params via `useSearchParams` so links are shareable.
- Numbers in tables are right-aligned; text is left-aligned.
- Percentages render red below 30, green ≥ 80, gray otherwise (`pctColor` in
  `formatters.js`).
- Empty-state copy is `"No data — upload an exam to get started."` everywhere.
- Mobile: the sidebar collapses below `lg`; the hamburger in the header opens it.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Starts Vite dev server on `http://localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint over `src/` |
