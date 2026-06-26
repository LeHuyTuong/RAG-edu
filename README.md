# RAG-edu - History RAG Learning Platform

RAG-edu is a document-learning platform focused on Vietnamese history study
materials. The current backend direction is Spring Boot plus a FastAPI RAG
service: users upload documents, the Spring API stores metadata and files, then
the RAG service extracts content, chunks it, embeds it, stores vectors in
Qdrant, and answers questions with citations.

## Current Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Web app | Next.js, React, Tailwind CSS | Student/admin/moderator user interface |
| Main backend | Spring Boot, Java 21, Spring Security, JPA | Auth, users, folders, documents, settings, RAG gateway |
| RAG service | FastAPI, Python 3.12 | Extraction, chunking, embeddings, retrieval, LLM answers |
| Database | MySQL | Users, refresh tokens, folders, documents, settings |
| Vector store | Qdrant | Embedded document chunks for retrieval |
| AI provider | Google GenAI | Embeddings and answer generation |
| Local runtime | Docker Compose | MySQL, Spring backend, RAG service |

## Main Flow

1. A user registers or logs in through the Spring Boot API.
2. The user creates folders and uploads PDF/DOCX/TXT documents.
3. Spring Boot stores the file locally and creates a document record.
4. After the DB transaction commits, Spring Boot calls the RAG service to
   ingest the file.
5. FastAPI extracts text, chunks it, creates embeddings, and upserts vectors to
   Qdrant.
6. Users ask questions against a folder or the RAG gateway.
7. The RAG service retrieves relevant chunks and returns an answer with
   citations.

## Project Structure

```text
RAG-edu/
├─ backend/                 # Spring Boot API
│  ├─ src/main/java/        # Auth, documents, folders, settings, RAG gateway
│  ├─ src/main/resources/   # application.yml and Flyway migrations
│  └─ src/test/java/        # Spring unit/controller tests
├─ rag-service/             # FastAPI RAG service
│  ├─ app/api/              # /rag chat, ingest, retrieve endpoints
│  ├─ app/services/         # extraction, chunking, embedding, retrieval, LLM
│  ├─ app/vectorstore/      # Qdrant client/repository
│  └─ tests/                # Python unit/API tests
├─ apps/web/                # Next.js frontend
├─ apps/test-files/         # Small sample files for upload/manual testing
├─ packages/                # Shared frontend tokens/config packages
├─ docker-compose.yaml      # Local MySQL + backend + RAG service
├─ e2e-test.sh              # Spring/RAG smoke test script
└─ .env.example             # Environment variable template
```

## Environment

Copy the root template and fill in secrets:

```bash
cp .env.example .env
```

Important variables:

| Variable | Description |
| --- | --- |
| `MYSQL_URL` | Spring datasource URL |
| `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL credentials |
| `JWT_SECRET_KEY` | HS384 JWT signing key |
| `RAG_SERVICE_URL` | Spring -> FastAPI base URL |
| `QDRANT_URL` / `QDRANT_API_KEY` | Qdrant endpoint and key |
| `QDRANT_COLLECTION` | Vector collection name |
| `GOOGLE_API_KEY` | Google GenAI key |
| `UPLOAD_BASE_PATH` | Local upload directory shared by Spring/RAG |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins |

## Local Development

### Run the backend stack with Docker

```bash
docker compose up --build
```

Default local services:

| Service | URL |
| --- | --- |
| Spring Boot API | `http://localhost:8080` |
| API base path | `http://localhost:8080/api/v1` |
| RAG service | `http://localhost:8001` |
| MySQL | `localhost:3307` |

Health checks:

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/rag/health
curl http://localhost:8001/rag/health
```

### Run Spring Boot directly

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

### Run the RAG service directly

```bash
cd rag-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

On Windows PowerShell:

```powershell
cd rag-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Run the web app

```bash
pnpm install
pnpm --filter web dev
```

The web app is still being aligned to the Spring Boot API contract. When working
on frontend integration, set `NEXT_PUBLIC_API_URL=http://localhost:8080`.

## Useful Commands

| Command | Description |
| --- | --- |
| `docker compose up --build` | Start MySQL, Spring Boot backend, and RAG service |
| `cd backend && ./mvnw test` | Run Spring tests |
| `cd rag-service && pytest` | Run RAG service tests |
| `pnpm --filter web dev` | Start the Next.js web app |
| `pnpm --filter web test` | Run web tests |
| `./e2e-test.sh` | Run Spring/RAG smoke flow after services are up |

## API Overview

Spring Boot exposes versioned APIs under `/api/v1`.

Key groups:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET/POST /api/v1/folders`
- `POST /api/v1/folders/{id}/chat`
- `GET/POST /api/v1/documents`
- `PATCH /api/v1/documents/{id}`
- `DELETE /api/v1/documents/{id}`
- `POST /api/v1/documents/{id}/restore`
- `POST /api/v1/documents/{id}/reindex`
- `GET/PATCH /api/v1/admin/config`
- `GET /api/v1/dashboard`
- `POST /api/v1/rag/chat`
- `POST /api/v1/rag/chat/stream`
- `POST /api/v1/rag/retrieve`
- `POST /api/v1/rag/ingest`

FastAPI RAG endpoints are mounted under `/rag`.

## Notes For Contributors

- Treat `backend/` and `rag-service/` as the source of truth for backend work.
- The removed NestJS/MongoDB backend artifacts are no longer part of the active
  backend direction.
- Keep generated folders out of git: `.next/`, `target/`, `__pycache__/`,
  `.pytest_cache/`, `.venv/`, and uploaded local files.
- Before changing API contracts, update the web integration code and the E2E
  script together.
