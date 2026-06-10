# Florence — Document & Report Management Platform

Florence is a full-stack web application for managing documents and generating automated reports. Users can upload documents to cloud storage, configure report generation rules based on document naming patterns, subscribe to report notifications, and receive generated reports as CSV email attachments — all on a configurable schedule.

The platform is built with an Angular 17 frontend, a Node.js/Express backend, MongoDB for persistence, Apache Kafka for asynchronous event processing, Amazon S3 for file storage, and Amazon SES for email delivery.

---

## Running the Application

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- AWS credentials with S3 and SES access (for file storage and email delivery)
- A verified sender identity in Amazon SES

### 1. Configure environment variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://mongo:27017/florencedb
JWT_SECRET=<a long random secret>
AWS_ACCESS_KEY_ID=<your AWS key>
AWS_SECRET_ACCESS_KEY=<your AWS secret>
AWS_REGION=us-east-1
S3_BUCKET_NAME=<your S3 bucket>
PORT=3000
KAFKA_BROKER=kafka:9092
SES_FROM_EMAIL=<verified SES sender address>
# Optional: override SES region if different from S3 region
SES_REGION=
# Optional: comma-separated IPs allowed to call /internal/* endpoints
INTERNAL_ALLOWED_IPS=
```

### 2. Start all services

```bash
docker compose up --build
```

This starts:

| Service | URL |
|---|---|
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| MongoDB | localhost:27018 |
| Kafka | localhost:9092 (internal) |

### 3. Run the backend in development mode (without Docker)

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## API Collection (Postman)

A Postman collection is included at [`docs/florence-api.postman_collection.json`](docs/florence-api.postman_collection.json).

Import it into Postman to interact with all API endpoints. The collection is organised into folders that mirror the workflow:

1. **Authentication** — register, login, wrong-password guard
2. **Documents** — upload → list → get → update → download → delete
3. **Reports** — create → list → get → update → subscribe → unsubscribe → delete
4. **Internal** — manually trigger due report generation (no need to wait for the midnight cron)
5. **Auth Guards** — 401 checks for unauthenticated requests

The `Login` request automatically saves the JWT to a collection variable (`authToken`) that all subsequent requests use. `Upload Document` and `Create Report` save their IDs the same way — run the folders in order for a smooth end-to-end walkthrough.

> **Working directory:** Point Postman's working directory (Settings → General → Working directory) to the repository root so that the sample upload fixture at `docs/test-fixtures/sample-upload.txt` resolves correctly.

---

## Capabilities

### User capabilities

| Capability | Notes |
|---|---|
| **Registration** | Users register with an email address and a password. Passwords are hashed with Argon2 before storage. |
| **Login** | Successful login returns a JWT that must be included as a `Bearer` token on all protected endpoints. |

### Document capabilities

| Capability | Notes |
|---|---|
| **Upload** | Multipart file upload; the binary is stored in S3 and metadata (original name, S3 key, uploader) is persisted in MongoDB. |
| **Update** | Update document metadata. |
| **List** | Returns all documents visible to the authenticated user. |
| **Get** | Retrieve a single document's metadata by ID. |
| **Download** | Returns a pre-signed S3 URL that allows the client to download the file directly from S3. |

> **Access model assumption:** At this stage all authenticated users have full access to all document operations. There is currently no role separation — this is a deliberate simplification. A future improvement would be to introduce proper roles (e.g. owner, viewer, admin) backed by a role-based access control (RBAC) system, with documents scoped to the user or organisation that uploaded them.

### Report capabilities

| Capability | Notes |
|---|---|
| **Report configuration creation** | Create a report configuration with a name, a file-name glob pattern, and a generation frequency (in days). |
| **Report configuration update** | Update any field of an existing report configuration. |
| **Report configuration deletion** | Delete a report configuration (and its associated subscription records). |
| **Report configuration list** | List all report configurations. |
| **Report configuration get** | Retrieve a single report configuration by ID. |
| **Report generation** | Reports are generated automatically by a midnight cron job. A report is considered *due* when it has never been generated, or when `lastGeneratedAt + frequencyDays` is in the past. The cron emits a Kafka message per due report; a Kafka consumer processes each message, filters matching documents, runs the processing function over them, and uploads the result as a CSV to S3. |
| **Subscription to report generation notification** | Users can subscribe or unsubscribe to a report. Subscribers receive an email via SES with the generated CSV attached whenever a new report instance is produced. |

> **Access model assumption:** As with documents, all authenticated users currently have full access to all report operations. Role-based restrictions (e.g. only the configuration owner can delete it) are a planned future improvement.

> **Document selection assumption:** Documents are matched to a report configuration using a glob pattern applied to the document's file name (powered by [`minimatch`](https://github.com/isaacs/minimatch)). For example, a pattern of `*06*.pdf` selects all PDF files whose name contains `06`. This design was chosen because reports run on a recurring schedule — new documents will be uploaded between runs, and the glob pattern ensures those new files are automatically included in the next generation without manual re-selection. A possible future enhancement would be to allow explicit per-document selection in addition to, or instead of, the pattern-based approach.

> **Processing function assumption:** The document processing step is currently implemented as an abstract placeholder (a simulated `sleep` + random result). This represents whatever real processing logic is required — for example, OCR, data extraction, or image analysis — and is intentionally left generic given the abstract nature of the problem. A future improvement could allow the processing function (or pipeline) to be specified per report configuration, enabling different processing strategies for different report types.

---

## Architecture Overview

```
Browser (Angular 17)
        │  HTTP / REST
        ▼
Express API (Node.js + TypeScript)
  ├── /api/auth        — registration & login (JWT)
  ├── /api/documents   — CRUD + S3 upload / presigned download
  ├── /api/reports     — report config CRUD + subscriptions
  └── /internal        — cron trigger (IP-allowlisted)
        │
        ├── MongoDB (Mongoose) — users, documents, report configs, subscriptions, instances
        ├── Amazon S3          — document files + generated report CSVs
        ├── Apache Kafka       — report generation events + email notification events
        └── Amazon SES         — report CSV delivery by email
```

For a detailed end-to-end sequence diagram see [`docs/report-generation-flow.md`](docs/report-generation-flow.md).
