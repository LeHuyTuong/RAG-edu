# Hệ thống Quản lý Tài liệu Học tập AI (AI Study Hub)

## Project Overview

AI Study Hub is a web platform that centralizes students' learning documents and enables fast retrieval and AI-assisted Q&A. It addresses scattered storage, poor organization, and the difficulty of quickly finding or asking about previous materials. The system targets both students and development teams building a real-world fullstack workflow.

Core scope:

- Authentication: sign up, sign in/out, password recovery, profile updates
- Document management: upload, list, download, delete, edit metadata, view details
- Search and filtering: search documents, filter by subject
- Cloud storage: upload to cloud, upload status, file preview
- AI chatbot: ask questions about documents, receive AI answers, view chat history

## Tech Stack

| Category             | Technology              | Purpose                                                         |
| -------------------- | ----------------------- | --------------------------------------------------------------- |
| Backend framework    | NestJS                  | API server, modular backend and business logic                  |
| Frontend framework   | Next.js                 | Web app and documentation site (SSR/SSG)                        |
| Language             | TypeScript              | Typesafe JavaScript development across stack                    |
| Monorepo tooling     | Turborepo               | Manage builds, caching and task orchestration in the monorepo   |
| Package manager      | pnpm                    | Fast, disk-efficient workspace installs                         |
| Runtime              | Node.js >= 18           | JavaScript runtime for servers and tooling                      |
| Database             | MongoDB                 | Document database used by the app (local via Docker Compose)    |
| Containerization     | Docker & Docker Compose | Run local services and isolate environments                     |
| Linting & formatting | ESLint, Prettier        | Enforce code quality and consistent formatting                  |
| Testing              | Vitest & Jest           | Unit and integration testing for frontend, backend and packages |

## Local Development

```sh
# 1. Clone repository
git clone <repository-url>
cd ai-study-hub

# 2. Install dependencies
pnpm install

# 3. Setup environment (required)
# Copy the example env and edit values locally. Do NOT commit your .env.
cp .env.example .env

# 4. Setup MongoDB Replica Set and Prisma (one command!)
# This initializes the 3-node replica set, syncs the schema, and seeds data
pnpm db:setup

# 5. Start the app
pnpm dev
```

## Commands

| Command            | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Start development mode for the workspace (runs app servers and watchers defined by the monorepo). |
| `pnpm test`        | Run unit and integration tests across the workspace.                                              |
| `pnpm build`       | Build production artifacts for all apps (Next.js, NestJS, packages).                              |
| `pnpm lint`        | Run ESLint across packages and apps to catch style and correctness issues.                        |
| `pnpm check-types` | Run TypeScript type checks (`tsc --build` or equivalent) across the repo.                         |
| `pnpm format`      | Format codebase with Prettier.                                                                    |
| `pnpm db:setup`    | **One-command setup:** Start Docker, initialize MongoDB Replica Set, sync schema, seed data.      |
| `pnpm db:init`     | Initialize MongoDB Replica Set (runs automatically in `db:setup`).                                |
| `pnpm db:sync`     | Sync the Prisma schema to local MongoDB Replica Set and generate Prisma Client.                   |
| `pnpm db:seed`     | Seed local MongoDB with deterministic development data.                                           |
| `pnpm db:clean`    | Delete local API database records.                                                                |
| `pnpm db:reseed`   | Clean the local database and seed it again.                                                       |

Usage examples

```bash
# start local services and app in dev mode
cp .env.example .env
docker compose up -d
test -f apps/api/.env || cp apps/api/.env.example apps/api/.env
pnpm db:sync
pnpm db:seed
pnpm dev

# run tests
pnpm test

# build for production
pnpm build
```

## Project Structure

The repository follows a monorepo layout with apps and shared packages.

```
ai-study-hub/
├─ apps/
│  ├─ api/                # NestJS backend
│  │  ├─ src/
│  │  │  ├─ main.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ app.controller.ts
│  │  │  └─ app.service.ts
	│  │
│  │  └─ (package.json, tsconfig, tests)
│  ├─ web/                # Next.js frontend
│  │  ├─ app/
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ globals.css
│  │  └─ (package.json, tsconfig)
│  └─ docs/               # Documentation site / markdown
├─ mobile/                # Expo React Native app (mobile)
│  ├─ src/                # app source code (screens, components, hooks)
│  ├─ assets/             # images, icons and other static assets
│  ├─ package.json
  │  └─ README.md
├─ packages/              # Shared packages and config
│  ├─ tokens/             # Shared design tokens and semantic aliases
│  ├─ ui/                 # Shared React UI components
│  │  ├─ src/
│  │  │  ├─ button.tsx
│  │  │  └─ card.tsx
│  ├─ eslint-config/      # ESLint shareable configs
│  └─ typescript-config/  # TSConfig presets for packages/apps
├─ docker-compose.yaml    # Local services (MongoDB)
├─ .env.example           # Example environment variables
├─ package.json           # Workspace scripts and tooling
├─ pnpm-workspace.yaml    # pnpm workspace configuration
└─ turbo.json             # Turborepo configuration
```

Notes

- Each `apps/*` folder is an independently runnable application. Use `pnpm dev` at workspace root to run the dev flow defined in this monorepo.
- Put local secrets in `.env` (copy from `.env.example`) and do not commit `.env`.

## API Docs

To be added.

## Team Docs

- Contributing Guide: [apps/docs/CONTRIBUTING.md](apps/docs/CONTRIBUTING.md)
- Naming Conventions: [apps/docs/NAMING_CONVENTIONS.md](apps/docs/NAMING_CONVENTIONS.md)
- Shared Tokens: [apps/docs/SHARED_TOKENS.md](apps/docs/SHARED_TOKENS.md)
- Testing: [apps/docs/TESTING.md](apps/docs/TESTING.md)
- Web app README: [apps/web/README.md](apps/web/README.md)

## Team Members

To be added.
