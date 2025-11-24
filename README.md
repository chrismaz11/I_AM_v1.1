# I AM v1.1 - Decentralized Credential Platform

Secure, portable credentials for individuals and institutions with verifiable workflows and privacy-first storage.

## Table of contents
- [Mission](#mission)
- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Agent system](#agent-system)
- [Workflow automation](#workflow-automation)
- [Business overview](#business-overview)
- [Roadmap](#roadmap)
- [Developer setup](#developer-setup)
- [Contributing](#contributing)
- [Auto-update](#auto-update)

## Mission
I AM delivers decentralized credential wallets that let people and institutions issue, hold, share, and verify trusted records without surrendering control of their data.

## Features
- Wallet creation with DID-style identifiers (`did:key`) and per-wallet encryption keys for credential storage.
- Credential issuance and storage with AES-256-GCM encrypted payloads, hashed integrity checks, and status tracking (pending, verified, revoked, expired).
- Share and verify flows using short-lived, HMAC-signed tokens that gate access to decrypted credential payloads.
- Authenticated user flows with NextAuth (credentials provider), role-aware data via Prisma models (users, institutions, roles, subscription plans), and audit logging.
- Evidence attachments and S3-ready file metadata for credential proof bundles.
- Verification lifecycle modeled with institution reviewers, assignments, and decision notes; seeded demo credential, accounts, and share token.
- Automation-ready project scaffolding with shared TypeScript types across services and Codex agents/workflows to keep code, docs, and operations in sync.

## Architecture
- Monorepo: `frontend` (Next.js App Router), `backend` (Express service), `packages/shared` (cross-service types), `codex` (automation), `docs` (plans and specs).
- Frontend (Next.js 14):
  - NextAuth credentials provider backed by Prisma/PostgreSQL; `User`, `Role`, `Institution`, `SubscriptionPlan`, `Credential`, `Verification`, `CredentialShare`, `File`, and `AuditLog` models.
  - API routes for registration (`/api/auth/register`), session handling (`/api/auth/[...nextauth]`), credential CRUD/share (`/api/credentials` + `/api/credentials/[id]`), and hashing utilities to fingerprint payloads.
  - Zod validators guard inputs; credential payloads are hashed for integrity; share tokens stored in DB with expiry and revocation flags.
  - Seed script populates demo users (admin, verifier, member), institution, subscription plans, credential, verification result, files, and share token.
  - UI scaffolds login/register and home; Tailwind CSS powers styling; shared Providers handle session context.
- Backend (Express):
  - REST routes under `/api` for health, wallet lifecycle, credential CRUD, share token creation, and verification of incoming share tokens.
  - Crypto service generates Ed25519 keys, DID strings, AES-256-GCM encrypted credential payloads, and HMAC share tokens; in-memory store maintains wallet and credential cache.
  - Error handling, CORS, Helmet, and request logging enabled; TypeScript-first with strict typings from `packages/shared`.
- Shared:
  - TypeScript contracts for wallets, credential metadata, encrypted payloads, share tokens, verification requests/results, and API responses reused by both services.
- Automation:
  - Codex config (`codex.json`, `agents.index.json`) registers active agents; PowerShell helpers (`run_workflow.ps1`, `update_readme.ps1`) run templated workflows and regenerate docs.

## Tech stack
- Application: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- Auth: NextAuth (credentials provider), bcrypt password hashing, JWT sessions.
- Data: Prisma ORM, PostgreSQL database, seed scripts for demo data.
- Files: AWS SDK for S3 client (presigned upload/download ready), file metadata stored via Prisma.
- Backend services: Node 20, Express 4, Helmet/CORS/Morgan middleware, AES-GCM/HMAC crypto utilities.
- Tooling: ESLint, Zod validation, TSX for dev, workspaces via npm.

## Agent system
- architect: turns features into architecture, data models, API routes, and folder structures.
- coder: writes production-grade TypeScript/React/Prisma code aligned to repo structure.
- uiux: designs user flows, text wireframes, and component specs with the I AM palette.
- verification: defines deterministic credential verification pipelines with schemas and edge cases.
- security: surfaces OWASP-style risks and concrete mitigations across auth, storage, and logging.
- docs: produces concise developer-facing documentation for features and APIs.
- devops: delivers deploy/CI/CD plans, env vars, scaling, and monitoring notes.
- compliance: maps data handling to frameworks like SOC2/GDPR/FERPA and suggests remediations.
- grantwriter: drafts persuasive grant/RFP responses tailored to funding goals.

## Workflow automation
- `codex/workflows/deploy_app.md` (devops): deployment and CI/CD plan with env var checklist.
- `codex/workflows/generate_ui.md` (uiux): converts specs to flows, wireframes, and components.
- `codex/workflows/verify_credential.md` (verification): designs deterministic verification pipelines.
- `codex/workflows/write_code.md` (coder): produces production-ready code for targeted files/features.
- Run helpers via PowerShell: `pwsh ./codex/run_workflow.ps1 -workflow deploy_app -input "<context>"`.

## Business overview
- Product: decentralized credential wallet and verification rails for individuals and institutions, prioritizing user-owned identities and verifiable proofs.
- Segments: wallet holders (members), verifying institutions/reviewers, and admins managing policies/subscriptions.
- Revenue levers: subscription tiers (Free, Pro, Team, Enterprise) modeled in Prisma; verifier services and share/verification throughput as growth drivers.
- Trust & compliance: audit logging, verification workflow, and dedicated security/compliance agents to align with regulatory expectations; grantwriter agent supports funding and partnership narratives.

## Roadmap
- Persist the Express wallet/credential service to PostgreSQL and align crypto flows with the Next.js API for a single source of truth.
- Expand DID support (`ion`, `web`) with key rotation, backup/export, and recovery tooling for wallets.
- Ship end-to-end UI: dashboard for credentials, verification reviews, share link management, and audit log visibility.
- Integrate S3 uploads with presigned URLs, file scanning, and size/type policies; surface attachments in the UI.
- Harden security/compliance: RBAC by role/institution, secret management, structured logging, and automated tests (unit/API/e2e) in CI.

## Developer setup
- Prerequisites: Node 20+, PostgreSQL, PowerShell (for helper scripts), npm workspaces enabled.
- Install: `npm install` (root will install all workspaces).
- Environment (frontend `.env.local`):
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/iam
NEXTAUTH_SECRET=replace-with-strong-random
NEXTAUTH_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=example-bucket
```
- Database: `npm run --workspace frontend prisma:migrate` then `npm run --workspace frontend seed`.
- Development:
  - Backend API: `npm run dev:backend` (defaults to port 4000).
  - Frontend app/API routes: `npm run dev:frontend` (defaults to port 3000).
- Quality: `npm run lint` and `npm run typecheck` at the repo root; run workspace-specific scripts as needed.

## Contributing
- Create a feature branch, align with existing folder structure and TypeScript/Tailwind conventions.
- Add or update Prisma migrations, seeds, and Zod validators when modifying data contracts.
- Include tests or smoke scripts where practical; keep lint/typecheck passing before opening a PR.
- Use Codex workflows/agents for architecture, code, and documentation consistency; include concise PR descriptions and checklists.

## Auto-update
This README is generated by Codex.

