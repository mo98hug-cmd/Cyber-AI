# Workspace

## Overview

Cyber AI — a cybersecurity chatbot web application powered by Gemini AI. Features a sci-fi terminal aesthetic, real-time streaming responses, conversation history, and voice input.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Google Gemini via Replit AI Integrations (`@workspace/integrations-gemini-ai`)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion

## Artifacts

- **cyber-ai** (`/`): React+Vite frontend — cybersecurity chatbot UI
- **api-server** (`/api`): Express backend with Gemini chat routes

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `conversations` — chat conversation history (id, title, createdAt)
- `messages` — individual messages per conversation (id, conversationId, role, content, createdAt)

## AI Integration

Uses Replit AI Integrations for Gemini access (no API key required). Environment vars:
- `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `AI_INTEGRATIONS_GEMINI_API_KEY`

The chatbot is specialized as a cybersecurity expert covering: SQLi, XSS, CSRF, API security, BCrypt, database security, IAM/RBAC, CTF challenges, and OWASP guidelines.

## API Routes

- `GET /api/gemini/conversations` — list all conversations
- `POST /api/gemini/conversations` — create new conversation
- `GET /api/gemini/conversations/:id` — get conversation with messages
- `DELETE /api/gemini/conversations/:id` — delete conversation
- `GET /api/gemini/conversations/:id/messages` — list messages
- `POST /api/gemini/conversations/:id/messages` — send message + stream SSE response

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
