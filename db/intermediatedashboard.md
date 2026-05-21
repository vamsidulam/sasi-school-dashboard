# Intermediate Dashboard — Database Structure

**Firestore database name:** `intermediate-dashboards` (note the plural)

All documents include auto-managed `createdAt` and `updatedAt` server timestamps. Document IDs are auto-generated unless noted otherwise.

Relationships use string IDs (no DocumentReferences). Foreign-key existence is enforced on writes by the backend service layer (`assertRef`).

This document covers:
1. **Collections & Schema** — Data structure and relationships
2. **IntermediateDashboard API** — CRUD endpoints for data management
3. **IntermediateDashboardAnalytics API** — Read-only analytics endpoints for dashboard visualizations

---

## Two different "year" concepts

The dashboard distinguishes two unrelated time-period concepts. Don't confuse them:

| Collection | What it represents | Examples |
|---|---|---|
| **`Years`** | **Class year** within a stream — how far through the program | I, II |
| **`AcademicYears`** | **Calendar year range** the school is in | 2024-2026, 2025-2027 |

A `Years` doc belongs to a stream (MPC declares I and II for itself; BiPC declares its own).
An `AcademicYears` doc is **top-level / global** — one set of academic years shared across the whole dashboard.

---

## Hierarchy

```
Branch
 └── Exams       (require branchid)

Streams (global — no branchid)
Years   (global — no streamid)

AcademicYears  (top-level, global — e.g. "2024-2026")

Subjects        sit under (stream × class-year)
Students        optionally reference branch + academic year
Exams           reference branch × stream × class-year × academic-year (all required) + subjects map
ExamResults     reference exam × branch × stream × class-year × academic-year + per-subject answer maps
```

---

## Collections

### `Branches`

Top-level academic branch (the school/college branch — not a Git branch).

| Field        | Type      | Required | Notes                       |
| ------------ | --------- | -------- | --------------------------- |
| `name`       | string    | yes      | Display name                |
| `code`       | string    | yes      | Short code                  |
| `createdAt`  | timestamp | auto     | Server timestamp on insert  |
| `updatedAt`  | timestamp | auto     | Server timestamp on update  |

**Example**
```json
{ "id": "branch-int", "name": "Intermediate", "code": "INT" }
```

---

### `Streams`

**Global** academic stream (MPC, BiPC, CEC, etc.). Not scoped to a branch — the same stream applies across all branches.

| Field        | Type      | Required | Notes                             |
| ------------ | --------- | -------- | --------------------------------- |
| `name`       | string    | yes      | "MPC", "BiPC", "CEC" — **unique** |
| `createdAt`  | timestamp | auto     |                                   |
| `updatedAt`  | timestamp | auto     |                                   |

**Example**
```json
{ "id": "stream-mpc", "name": "MPC" }
```

> **Heads-up:** older Stream docs may still carry a `branchid` field from a previous schema. The service ignores it — keep it or strip it; existing FK references (`Years.streamid`, `Exams.streamid`, etc.) continue to work either way.

---

### `Years` (class year)

**Global** class year (I, II, etc.). Not scoped to a stream — the same year applies across all streams.

| Field        | Type      | Required | Notes                             |
| ------------ | --------- | -------- | --------------------------------- |
| `yearname`   | string    | yes      | "I", "II" — **unique**            |
| `createdAt`  | timestamp | auto     |                                   |
| `updatedAt`  | timestamp | auto     |                                   |

**Example**
```json
{ "id": "year-1", "yearname": "I" }
```

> **Heads-up:** older Year docs may still carry a `streamid` field from a previous schema. The service ignores it — FK references (`Subjects.yearid`, `Exams.yearid`, etc.) continue to work either way.

---

### `AcademicYears`

**Top-level / global** calendar year range. Shared across all branches.

| Field        | Type      | Required | Notes                             |
| ------------ | --------- | -------- | --------------------------------- |
| `name`       | string    | yes      | "2024-2026", "2025-2027"          |
| `createdAt`  | timestamp | auto     |                                   |
| `updatedAt`  | timestamp | auto     |                                   |

**Example**
```json
{ "id": "ay-2024-2026", "name": "2024-2026" }
```

---

### `Subjects`

Subjects available for a given (stream × class-year) combination.

| Field        | Type      | Required | Notes                                       |
| ------------ | --------- | -------- | ------------------------------------------- |
| `name`       | string    | yes      | "maths", "physics", "chemistry"             |
| `streamid`   | string    | yes      | FK → `Streams.id` (enforced)                |
| `yearid`     | string    | yes      | FK → `Years.id` (class year, enforced)      |
| `createdAt`  | timestamp | auto     |                                             |
| `updatedAt`  | timestamp | auto     |                                             |

**Example**
```json
{
  "id": "subj-mpc-1-maths",
  "name": "maths",
  "streamid": "stream-mpc",
  "yearid": "year-mpc-1"
}
```

---

### `Students`

Individual student record. Only `code` is required — every other field is optional so partial rosters can be imported.

**IMPORTANT:** The `branchid`, `streamid`, `yearid`, and `academicyearid` fields store **document IDs** (not text values). When uploading students via the upload endpoint, the system accepts branch/stream/year names or codes from the spreadsheet and automatically resolves them to the correct document IDs by looking up the respective collections. Rows with unmatched values are skipped and reported as errors.

| Field             | Type         | Required | Notes                                            |
| ----------------- | ------------ | -------- | ------------------------------------------------ |
| `code`            | string       | **yes**  | Unique student code / roll number                |
| `name`            | string\|null | no       | Full name                                        |
| `phone`           | string\|null | no       | Phone number                                     |
| `parentname`      | string\|null | no       | Parent/guardian name                             |
| `branchid`        | string\|null | no       | FK → `Branches.id` (document ID, enforced if present) |
| `academicyearid`  | string\|null | no       | FK → `AcademicYears.id` (document ID, enforced if present) |
| `streamid`        | string\|null | no       | FK → `Streams.id` (document ID, enforced if present) |
| `yearid`          | string\|null | no       | FK → `Years.id` (document ID, enforced if present) |
| `createdAt`       | timestamp    | auto     |                                                  |
| `updatedAt`       | timestamp    | auto     |                                                  |

When the API returns a student it hydrates `branchName` and `branchCode` from the `Branches` collection.

**Example**
```json
{
  "id": "CXg4K8vLmN9pQrStUvWx",
  "code": "172511052",
  "name": "G NEKHIL",
  "phone": "6303510819",
  "parentname": "G RAMU",
  "branchid": "BranchDocId123ABC",
  "streamid": "StreamDocId456DEF",
  "yearid": "YearDocId789GHI",
  "academicyearid": null,
  "createdAt": { "_seconds": 1747812907, "_nanoseconds": 123000000 },
  "updatedAt": { "_seconds": 1747812907, "_nanoseconds": 123000000 }
}
```

**Upload behavior:**
- Sheet contains: `branchid="VZH"`, `streamid="MPC"`, `yearid="I"`
- System looks up `Branches` collection for name/code matching "VZH" (case-insensitive)
- Finds document ID `BranchDocId123ABC` and stores that
- Same process for stream, year, and academic year
- If lookup fails, row is skipped with error: `"Branch 'VZH' not found in Branches collection"`

---

### `Exams`

An exam definition. Carries a `subjects` map declaring how many questions each subject has — `ExamResults` for the same exam must follow this shape.

| Field             | Type             | Required | Notes                                            |
| ----------------- | ---------------- | -------- | ------------------------------------------------ |
| `examname`        | string           | yes      |                                                  |
| `branchid`        | string           | yes      | FK → `Branches.id` (enforced)                    |
| `streamid`        | string           | yes      | FK → `Streams.id` (enforced)                     |
| `yearid`          | string           | yes      | FK → `Years.id` (class year, enforced)           |
| `academicyearid`  | string           | yes      | FK → `AcademicYears.id` (enforced)               |
| `examtypeid`      | string           | yes      | FK → `ExamTypes.id` (enforced)                   |
| `examdate`        | string (ISO)     | yes      | "2026-05-12"                                     |
| `totalquestions`  | integer          | yes      | Should equal sum of `subjects` values            |
| `subjects`        | map<string,int>  | no       | `{ <subjectId>: numberOfQuestions }` — keys are real `Subjects.id` values (FK-enforced) belonging to the exam's (streamid, yearid) |
| `createdAt`       | timestamp        | auto     |                                                  |
| `updatedAt`       | timestamp        | auto     |                                                  |

**Example**
```json
{
  "id": "exam-001",
  "examname": "Weekly Test 5",
  "branchid": "branch-int",
  "streamid": "stream-mpc",
  "yearid": "year-mpc-1",
  "academicyearid": "ay-2024-2026",
  "examtypeid": "et-weekly",
  "examdate": "2026-05-12",
  "totalquestions": 60,
  "subjects": {
    "subj-mpc-1-maths":     30,
    "subj-mpc-1-physics":   15,
    "subj-mpc-1-chemistry": 15
  }
}
```

> **Migration note:** older exam docs created before the subject-ID change have
> *subject names* as keys in `subjects` (e.g. `{ "maths": 30 }`). New writes use
> Subjects collection IDs. Recreate or backfill those docs to migrate.

---

### `ExamResults`

One document per (student × exam) — holds that student's answers across all subjects. Carries fully-denormalized FKs (`branchid`, `streamid`, `yearid`, `academicyearid`) so result listings can be filtered along any axis without a join. The shape of `subjects` mirrors `Exams.subjects` — keys are subject names, values are `{ q1, q2, ..., qN }` answer maps.

| Field             | Type                              | Required | Notes                                          |
| ----------------- | --------------------------------- | -------- | ---------------------------------------------- |
| `examid`          | string                            | yes      | FK → `Exams.id` (enforced)                     |
| `branchid`        | string                            | yes      | FK → `Branches.id` (enforced)                  |
| `streamid`        | string                            | yes      | FK → `Streams.id` (enforced)                   |
| `yearid`          | string                            | yes      | FK → `Years.id` (class year, enforced)         |
| `academicyearid`  | string                            | yes      | FK → `AcademicYears.id` (enforced)             |
| `studentid`       | string                            | no       | FK → `Students.id` (no FK enforcement today)   |
| `subjects`        | map<string, map<string,string>>   | yes      | `{ <subjectId>: { N: answer } (keys are bare question numbers: "1", "2", "3", …) }` — keys match the exam's `subjects` map |
| `createdAt`       | timestamp                         | auto     |                                                |
| `updatedAt`       | timestamp                         | auto     |                                                |

**Example**
```json
{
  "id": "result-xyz",
  "examid": "exam-001",
  "branchid": "branch-int",
  "streamid": "stream-mpc",
  "yearid": "year-mpc-1",
  "academicyearid": "ay-2024-2026",
  "studentid": "student-abc123",
  "subjects": {
    "subj-mpc-1-maths":     { "1": "A", "2": "C", "3": "B" },
    "subj-mpc-1-physics":   { "1": "D", "2": "A" },
    "subj-mpc-1-chemistry": { "1": "B", "2": "D" }
  }
}
```

---

### `ExamTypes`

Reusable categorisation tag for exams (e.g. "Weekly Test", "Grand Test", "Mock"). Referenced from `Exams.examtypeid` (required, FK-enforced).

| Field        | Type      | Required | Notes                       |
| ------------ | --------- | -------- | --------------------------- |
| `name`       | string    | yes      | Display name — **unique**   |
| `createdAt`  | timestamp | auto     |                             |
| `updatedAt`  | timestamp | auto     |                             |

**Example**
```json
{ "id": "et-weekly", "name": "Weekly Test" }
```

---

### `Topics` / `Subtopics` / `Levels` / `QuestionTypes`

Four small lookup collections that the upload service treats as **auto-populating dictionaries** — uploads find-or-create entries by name so the data stays deduplicated.

**All four share the same shape:**

| Field        | Type      | Required | Notes                                          |
| ------------ | --------- | -------- | ---------------------------------------------- |
| `name`       | string    | yes      | Display name (original casing preserved)       |
| `nameLower`  | string    | yes      | Lowercased trimmed name — used for uniqueness  |
| `createdAt`  | timestamp | auto     |                                                |
| `updatedAt`  | timestamp | auto     |                                                |

`name` is **globally unique** within each collection (enforced case-insensitively via `nameLower`).

**`Levels` and `QuestionTypes`** apply a synonyms map at write time so common spelling variations all resolve to a single canonical entry. Examples that collapse:

- Level: `easy`, `simple`, `low`, `e` → `easy` · `medium`, `moderate`, `intermediate`, `med`, `m` → `medium` · `difficult`, `hard`, `tough`, `d` → `difficult`
- QuestionType: `theoretical`, `theoritical`, `theoritcal`, `theory`, `t` → `theoretical` · `mathematical`, `math`, `maths`, `numerical` → `mathematical` · `applicative`, `application`, `applied`, `app` → `applicative`

Topics and Subtopics have no synonyms — only case-insensitive matching.

**Examples**
```json
{ "id": "topic-electric-field", "name": "ELECTRIC FIELD", "nameLower": "electric field" }
{ "id": "subtopic-derivatives",  "name": "Derivatives",    "nameLower": "derivatives" }
{ "id": "level-medium",          "name": "medium",         "nameLower": "medium" }
{ "id": "qtype-mathematical",    "name": "mathematical",   "nameLower": "mathematical" }
```

These IDs are what `ExamQuestionTopics.subjects[*][*]` stores (no string duplication).

---

### `ExamQuestionTopics`

Per-question topic and difficulty metadata for a single exam. **One document per `examid`** — the upload endpoint upserts into this doc.

| Field        | Type                                  | Required | Notes                                                   |
| ------------ | ------------------------------------- | -------- | ------------------------------------------------------- |
| `examid`     | string                                | yes      | FK → `Exams.id` — **unique** (one doc per exam)         |
| `subjects`   | map<string, map<string, QuestionMeta>>| no       | `{ <subjectId>: { <questionId>: meta } }`               |
| `createdAt`  | timestamp                             | auto     |                                                         |
| `updatedAt`  | timestamp                             | auto     |                                                         |

`QuestionMeta`:

| Field             | Type           | Required | Notes                                                                |
| ----------------- | -------------- | -------- | -------------------------------------------------------------------- |
| `topicid`         | string         | yes      | FK → `Topics.id` (FK-enforced)                                       |
| `subtopicid`      | string\|null   | no       | FK → `Subtopics.id` (FK-enforced if present)                         |
| `levelid`         | string         | yes      | FK → `Levels.id` (FK-enforced)                                       |
| `questiontypeid`  | string         | yes      | FK → `QuestionTypes.id` (FK-enforced)                                |

> Prior versions of this collection stored topic/subtopic/level/questiontype as *strings* inline.
> New writes use IDs only — the upload service auto-creates lookup entries on the fly.

- Each subject ID must exist in `Subjects` and belong to the exam's (streamid, yearid).
- Question IDs are bare numeric strings — `"1"`, `"2"`, `"3"`, …
- The upload service stores values exactly as provided (no auto-prefix).
- These IDs line up with answer keys in `ExamResults.subjects`.
- **Missing-question detection:** after each upload the service compares the merged doc against the exam's declared count per subject (e.g. maths declares 50 questions). Expected IDs that are still absent are returned in `warnings` (human-readable) and `missing` (`{ [subjectId]: [missingId, …] }`).

**Example**
```json
{
  "id": "eqt-001",
  "examid": "exam-001",
  "subjects": {
    "subj-mpc-1-maths": {
      "1": { "topicid": "topic-calc", "subtopicid": "sub-deriv",   "levelid": "level-easy",   "questiontypeid": "qtype-math" },
      "2": { "topicid": "topic-calc", "subtopicid": "sub-integ",   "levelid": "level-medium", "questiontypeid": "qtype-math" }
    },
    "subj-mpc-1-physics": {
      "1": { "topicid": "topic-mech", "subtopicid": "sub-kinemat", "levelid": "level-easy",   "questiontypeid": "qtype-theory" }
    }
  }
}
```

---

## API surface (Cloud Function: `IntermediateDashboard`)

Routes live under one Express app exported as `exports.IntermediateDashboard`. Each entity is mounted at its own prefix; all support standard pagination (`?cursor=<docId>`, page size 10).

| Prefix             | Verbs                              | Extras                                                              |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------- |
| `/students`        | GET, GET/:id, POST, PUT, DELETE    | —                                                                   |
| `/branches`        | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (no pagination)                                     |
| `/streams`         | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (no filter — streams are global)                    |
| `/years`           | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (no filter — years are global)                      |
| `/academicyears`   | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (no filter; global)                                 |
| `/subjects`        | GET, GET/:id, POST, PUT, DELETE    | `GET /by/stream-year?streamid=&yearid=`                             |
| `/exams`           | GET, GET/:id, POST, PUT, DELETE    | `GET /subjects/by-stream-year?streamid=&yearid=`                    |
| `/examresults`     | GET, GET/:id, POST, PUT, DELETE    | List supports `?examid=&branchid=&streamid=&yearid=&academicyearid=&studentid=` filters |
| `/examtypes`       | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (no pagination) — for dropdowns         |
| `/examquestiontopics` | GET, GET/:id, POST, PUT, DELETE | `GET /by-exam/:examid` returns the single doc for an exam (or 404); list supports `?examid=` |
| `/topics`          | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` (dropdowns)                                         |
| `/subtopics`       | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list`                                                     |
| `/levels`          | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` — applies synonym normalization on create/update    |
| `/questiontypes`   | GET, GET/:id, POST, PUT, DELETE    | `GET /all/list` — applies synonym normalization on create/update    |
| `/upload/examquestiontopics` | POST                       | Bulk upsert from `[{ subject/subjectId, questionId, topic, subtopic?, level, questiontype }, ...]` — auto-creates missing Topic / Subtopic / Level / QuestionType entries, stores IDs |

Pagination response shape:
```json
{
  "items": [...],
  "nextCursor": "docId" | null,
  "hasMore": true | false,
  "pageSize": 10
}
```

`all/list` / `by/stream-year` helpers return `{ "items": [...] }` (no pagination).

---

## Validation & FK enforcement

- Required fields are validated server-side (see each service's `validate()`).
- All required FK writes call `assertRef` on the target collection — invalid ID returns **400** with `{ msg: "<field> <id> does not exist" }`.
- Optional FKs are also enforced when present (e.g. `Students.branchid`, `Students.academicyearid`).
- Updates are partial — only supplied fields are validated and written.
- Deletes are hard deletes (no soft-delete or cascade today).

---

## Uniqueness constraints

All checked at the service layer on `create`, and re-checked on `update` if the relevant fields are in the patch. Violations return **400** with a descriptive message.

| Collection      | Unique key                       | Scope                                              |
| --------------- | -------------------------------- | -------------------------------------------------- |
| `Branches`      | `code`                           | global                                             |
| `Streams`       | `name`                           | global — one "MPC" shared across branches          |
| `Years`         | `yearname`                       | global — one "I" / "II" shared across streams      |
| `AcademicYears` | `name`                           | global                                             |
| `Students`      | `code`                           | global                                             |
| `Exams`         | (`branchid`, `examname`)         | per branch — Branch A and B can both have "Test 1" |
| `ExamResults`   | (`examid`, `studentid`)          | per exam — one student attempts one exam once      |
| `ExamTypes`     | `name`                           | global                                             |
| `ExamQuestionTopics` | `examid`                    | one topics doc per exam                            |
| `Topics`        | `name` (case-insensitive)        | global                                             |
| `Subtopics`     | `name` (case-insensitive)        | global                                             |
| `Levels`        | `name` (canonicalized via synonyms) | global                                          |
| `QuestionTypes` | `name` (canonicalized via synonyms) | global                                          |

**Bulk uploads** (`/upload/students` and `/upload/examresults`) honor these same constraints but silently *skip* duplicate rows instead of erroring. The skip counts (`skipped.inFile`, `skipped.inDb`) are surfaced in the response.

---

## `UploadLogs` collection

Records every upload run — success or failure — so the dashboard UI can show upload history.

| Field             | Type                  | Notes                                                      |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| `type`            | string                | `"students"` or `"examresults"`                            |
| `fileName`        | string\|null          | Original file name (the client sends `body.fileName`)      |
| `uploadedBy`      | string\|null          | Identifier of the uploader (auth not wired today)          |
| `uploadedAt`      | timestamp             | Server timestamp on insert                                 |
| `status`          | string                | `"SUCCESS"` or `"FAILED"`                                  |
| `errorLog`        | string\|null          | Failure message (when `status === "FAILED"`)               |
| `inserted`        | integer\|null         | Row insert count (when `SUCCESS`)                          |
| `skipped`         | map\|null             | `{ inFile, inDb, invalid, studentNotFound? }`              |
| `errors`          | array\|null           | First 50 row errors (`{ rowIndex, code?/studentCode?, message }`) |
| `warnings`        | array\|null           | First 50 warnings (frontend-side)                          |
| `examid`          | string\|null          | (examresults only) — the target exam                       |
| `branchid`        | string\|null          | (examresults only)                                         |
| `streamid`        | string\|null          | (examresults only)                                         |
| `yearid`          | string\|null          | (examresults only)                                         |
| `academicyearid`  | string\|null          | (examresults only)                                         |

Best-effort writes — the response is sent first, then the log is written asynchronously. A failed log write does not surface to the caller.

**Endpoints:**
- `GET /upload/logs` — paginated list, supports `?type=students|examresults|examquestiontopics&status=SUCCESS|FAILED&cursor=`
- `GET /upload/logs/:id` — single log doc

---

## Analytics API (Cloud Function: `IntermediateDashboardAnalytics`)

Read-only aggregation endpoints for dashboard visualizations. All endpoints require filter parameters: `streamid`, `yearid`, `examtypeid`. Optional filters: `branchid`, `academicyearid`, `subject`, `exam` (specific exam name), `schemeR/W/L/C` (marking scheme).

### Common Filter Parameters

| Parameter        | Type    | Required | Notes                                                |
| ---------------- | ------- | -------- | ---------------------------------------------------- |
| `streamid`       | string  | **yes**  | FK → `Streams.id`                                    |
| `yearid`         | string  | **yes**  | FK → `Years.id`                                      |
| `examtypeid`     | string  | **yes**  | FK → `ExamTypes.id`                                  |
| `branchid`       | string  | no       | FK → `Branches.id` — filters to specific branch      |
| `academicyearid` | string  | no       | FK → `AcademicYears.id` — filters to specific year   |
| `subject`        | string  | no       | Subject ID or "ALL" (default)                        |
| `exam`           | string  | no       | Specific exam name or "ALL" (default)                |
| `schemeR`        | number  | no       | Marks for right answer (default: 4)                  |
| `schemeW`        | number  | no       | Marks for wrong answer (default: -1)                 |
| `schemeL`        | number  | no       | Marks for left/unanswered (default: 0)               |
| `schemeC`        | number  | no       | Marks for cancelled question (default: 4)            |

---

### Header Filters Endpoint

**GET** `/header-filters`

Returns dropdown options for stream, year, exam type, branch, academic year, subjects, and exams based on current filter selection.

**Query params:** `streamid`, `yearid`, `branchid`, `examtypeid`, `academicyearid` (all optional)

**Response:**
```json
{
  "streams": [
    { "id": "StreamDocId456DEF", "name": "MPC" }
  ],
  "years": [
    { "id": "YearDocId789GHI", "name": "I" },
    { "id": "YearDocId789JKL", "name": "II" }
  ],
  "examTypes": [
    { "id": "ExamTypeDocId111", "name": "GRAND" },
    { "id": "ExamTypeDocId222", "name": "WEEKLY" }
  ],
  "branches": [
    { "id": "BranchDocId123ABC", "name": "Vizianagaram", "code": "VZH" }
  ],
  "academicYears": [
    { "id": "AcademicYearDocId333", "name": "2024-2025" }
  ],
  "subjects": [
    { "id": "SubjectDocId444", "name": "Physics" }
  ],
  "exams": [
    { "id": "ExamDocId555", "name": "GRAND TEST 01", "examdate": "2026-05-12" }
  ]
}
```

---

### Overview Endpoints

#### Test Average

**GET** `/overview/test-average`

Returns average score, median, and student/test counts.

**Required filters:** `streamid`, `yearid`, `examtypeid`

**Response:**
```json
{
  "avg": 145.5,
  "med": 142.0,
  "students": 250,
  "exams": 5,
  "testRecords": 1250
}
```

---

#### Highest Score

**GET** `/overview/highest-score`

Returns top and lowest scores across all matching results.

**Response:**
```json
{
  "top": 198.0,
  "low": 45.0
}
```

---

#### Accuracy

**GET** `/overview/accuracy`

Returns percentage of correct answers among attempted questions.

**Response:**
```json
{
  "accuracy": 72.5,
  "totalAttempted": 45000,
  "totalCorrect": 32625
}
```

---

#### Attempt Rate

**GET** `/overview/attempt-rate`

Returns percentage of questions attempted vs total questions.

**Response:**
```json
{
  "attempt": 85.2,
  "totalQuestions": 60000,
  "totalAttempted": 51120
}
```

---

#### Score Trend

**GET** `/overview/score-trend`

Returns average and top scores for each exam.

**Response:**
```json
{
  "trend": [
    {
      "name": "GT 01",
      "full": "GRAND TEST 01",
      "avg": 142.5,
      "top": 198.0,
      "students": 250,
      "date": "2026-05-12"
    },
    {
      "name": "GT 02",
      "full": "GRAND TEST 02",
      "avg": 148.3,
      "top": 195.0,
      "students": 248,
      "date": "2026-05-19"
    }
  ]
}
```

---

#### Top Performers

**GET** `/overview/top-performers`

Returns top 10 students ranked by total score.

**Response:**
```json
{
  "performers": [
    {
      "student": "172511052",
      "studentid": "CXg4K8vLmN9pQrStUvWx",
      "total": 985.5,
      "tests": 5,
      "rank": 1
    },
    {
      "student": "172511053",
      "studentid": "DocId987ZYX",
      "total": 978.0,
      "tests": 5,
      "rank": 2
    }
  ]
}
```

---

#### Weakest Topics

**GET** `/overview/weakest-topics`

Returns topics with lowest accuracy (minimum 8 questions).

**Response:**
```json
{
  "topics": [
    {
      "label": "ELECTRIC FIELD",
      "topicid": "TopicDocId666",
      "acc": 45.2,
      "totalQuestions": 150,
      "correct": 68
    },
    {
      "label": "Derivatives",
      "topicid": "TopicDocId777",
      "acc": 52.8,
      "totalQuestions": 200,
      "correct": 106
    }
  ]
}
```

---

### Leaderboard Endpoints

#### List Students

**GET** `/leaderboard`

Returns all students with aggregated scores, sorted by rank.

**Required filters:** `streamid`, `yearid`, `examtypeid`

**Query params:**
- `limit` (default: 100)
- `offset` (default: 0)
- `sortBy` (default: "total") — can be: total, accuracy, attAcc, right, wrong, tests
- `sortDir` (default: "desc") — "asc" or "desc"
- `search` — filter by student code (partial match)

**Response:**
```json
{
  "students": [
    {
      "student": "172511052",
      "studentid": "CXg4K8vLmN9pQrStUvWx",
      "studentName": "G NEKHIL",
      "total": 985.5,
      "right": 245,
      "wrong": 105,
      "left": 50,
      "canc": 0,
      "att": 350,
      "nQ": 400,
      "tests": 5,
      "maxMark": 1600,
      "accuracy": 70.0,
      "attAcc": 81.67,
      "pctMark": 61.59,
      "rank": 1
    }
  ],
  "total": 250,
  "limit": 100,
  "offset": 0
}
```

---

#### Student Detail

**GET** `/leaderboard/student/:studentCode`

Returns detailed performance for a single student including test-by-test breakdown.

**Response:**
```json
{
  "summary": {
    "student": "172511052",
    "studentid": "CXg4K8vLmN9pQrStUvWx",
    "studentName": "G NEKHIL",
    "total": 985.5,
    "right": 245,
    "wrong": 105,
    "tests": 5,
    "accuracy": 70.0,
    "rank": 1,
    "totalStudents": 250
  },
  "testDetails": [
    {
      "examid": "ExamDocId555",
      "examname": "GRAND TEST 01",
      "examdate": "2026-05-12",
      "score": 198.0,
      "right": 51,
      "wrong": 20,
      "left": 9,
      "nQ": 80,
      "att": 71,
      "accuracy": 71.83,
      "attAcc": 89.47
    }
  ],
  "subjectBreakdown": {
    "Physics": { "right": 80, "wrong": 35, "left": 15, "nQ": 130, "accuracy": 61.54 },
    "Chemistry": { "right": 75, "wrong": 30, "left": 15, "nQ": 120, "accuracy": 62.5 },
    "Maths": { "right": 90, "wrong": 40, "left": 20, "nQ": 150, "accuracy": 60.0 }
  }
}
```

---

### Topic Mastery Endpoints

#### By Topic

**GET** `/topic-mastery/by-topic`

Returns accuracy breakdown by topic.

**Response:**
```json
{
  "topics": [
    {
      "label": "ELECTRIC FIELD",
      "topicid": "TopicDocId666",
      "R": 680,
      "W": 420,
      "L": 150,
      "C": 0,
      "n": 1250,
      "acc": 54.4,
      "attAcc": 61.82
    }
  ]
}
```

---

#### By Subtopic

**GET** `/topic-mastery/by-subtopic`

Returns accuracy breakdown by subtopic.

---

#### By Level

**GET** `/topic-mastery/by-level`

Returns accuracy by difficulty level (easy/medium/difficult).

**Response:**
```json
{
  "levels": [
    {
      "label": "easy",
      "levelid": "LevelDocId888",
      "R": 3500,
      "W": 800,
      "L": 200,
      "n": 4500,
      "acc": 77.78,
      "attAcc": 81.40
    },
    {
      "label": "medium",
      "levelid": "LevelDocId889",
      "R": 2200,
      "W": 1100,
      "L": 300,
      "n": 3600,
      "acc": 61.11,
      "attAcc": 66.67
    },
    {
      "label": "difficult",
      "levelid": "LevelDocId890",
      "R": 900,
      "W": 1200,
      "L": 400,
      "n": 2500,
      "acc": 36.0,
      "attAcc": 42.86
    }
  ]
}
```

---

#### By Question Type

**GET** `/topic-mastery/by-qtype`

Returns accuracy by question type (theoretical/mathematical/applicative).

---

### Difficulty & Type Analysis Endpoints

#### Summary

**GET** `/difficulty-type/summary`

Returns overall counts by level and question type.

**Response:**
```json
{
  "byLevel": [
    { "label": "easy", "totalQuestions": 4500, "avgAccuracy": 77.78 },
    { "label": "medium", "totalQuestions": 3600, "avgAccuracy": 61.11 },
    { "label": "difficult", "totalQuestions": 2500, "avgAccuracy": 36.0 }
  ],
  "byQtype": [
    { "label": "theoretical", "totalQuestions": 3200, "avgAccuracy": 68.5 },
    { "label": "mathematical", "totalQuestions": 4800, "avgAccuracy": 58.2 },
    { "label": "applicative", "totalQuestions": 2600, "avgAccuracy": 52.3 }
  ]
}
```

---

#### Heatmap

**GET** `/difficulty-type/heatmap`

Returns accuracy for each (level × question type) combination.

**Response:**
```json
{
  "heatmap": [
    {
      "level": "easy",
      "levelid": "LevelDocId888",
      "qtype": "theoretical",
      "qtypeid": "QtypeDocId991",
      "acc": 82.5,
      "n": 1200
    },
    {
      "level": "easy",
      "levelid": "LevelDocId888",
      "qtype": "mathematical",
      "qtypeid": "QtypeDocId992",
      "acc": 75.3,
      "n": 1800
    }
  ]
}
```

---

### Test Trend Endpoints

#### List Trends

**GET** `/test-trend`

Returns score trends across all exams matching filters.

**Response:**
```json
{
  "trend": [
    {
      "examid": "ExamDocId555",
      "examname": "GRAND TEST 01",
      "examdate": "2026-05-12",
      "avg": 142.5,
      "med": 140.0,
      "top": 198.0,
      "low": 45.0,
      "students": 250,
      "totalQuestions": 80,
      "accuracy": 71.2,
      "attemptRate": 88.5
    }
  ]
}
```

---

#### Summary Stats

**GET** `/test-trend/summary`

Returns aggregated statistics across all exams.

**Response:**
```json
{
  "totalExams": 5,
  "totalStudents": 250,
  "avgScore": 145.8,
  "highestAvg": 152.3,
  "lowestAvg": 138.5,
  "avgAccuracy": 71.5,
  "avgAttemptRate": 87.2
}
```

---

#### Comparison

**GET** `/test-trend/comparison`

Returns side-by-side comparison of specified exams.

**Query params:** `exam1`, `exam2` (exam IDs)

**Response:**
```json
{
  "exam1": {
    "examid": "ExamDocId555",
    "examname": "GRAND TEST 01",
    "avg": 142.5,
    "students": 250
  },
  "exam2": {
    "examid": "ExamDocId556",
    "examname": "GRAND TEST 02",
    "avg": 148.3,
    "students": 248
  },
  "diff": {
    "avgDelta": 5.8,
    "studentsDelta": -2
  }
}
```

---

#### Growth Analysis

**GET** `/test-trend/growth`

Returns test-to-test growth rates.

**Response:**
```json
{
  "growth": [
    {
      "from": "GRAND TEST 01",
      "to": "GRAND TEST 02",
      "avgGrowth": 4.07,
      "topGrowth": -1.52,
      "accuracyGrowth": 2.1
    },
    {
      "from": "GRAND TEST 02",
      "to": "GRAND TEST 03",
      "avgGrowth": -2.3,
      "topGrowth": 3.5,
      "accuracyGrowth": -0.8
    }
  ]
}
```

---

## Data Flow Summary

### Upload Flow
1. User uploads Excel/CSV with student data containing branch name "VZH", stream "MPC", year "I"
2. Frontend extracts rows and sends to `/upload/students`
3. Backend loads all Branches/Streams/Years/AcademicYears collections into memory maps
4. For each row, looks up text values (case-insensitive) and resolves to document IDs
5. Validates IDs exist via FK enforcement
6. Inserts students with proper document ID references
7. Logs upload result to `UploadLogs` collection

### Analytics Query Flow
1. User selects filters: stream=MPC, year=I, examtype=GRAND
2. Frontend calls `/overview/test-average?streamid=...&yearid=...&examtypeid=...`
3. Backend queries ExamResults filtered by these IDs
4. Joins with ExamQuestionTopics to get topic/level/qtype metadata
5. Aggregates scores using marking scheme (R=4, W=-1, L=0, C=4)
6. Returns computed statistics

### Key Design Decisions
- **IDs not names** — All foreign keys store document IDs, enabling efficient queries and avoiding string comparison issues
- **Denormalized ExamResults** — Carries branchid/streamid/yearid/academicyearid so results can be filtered without joins
- **Auto-populating lookups** — Topics/Subtopics/Levels/QuestionTypes are find-or-created on upload to maintain deduplication
- **Synonym normalization** — Level and QuestionType inputs are canonicalized (e.g., "easy"/"simple"/"e" → "easy")
- **No cascading deletes** — Hard deletes only; FK orphans are possible and must be handled at application layer
