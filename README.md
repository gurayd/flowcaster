## Flowcaster

Flowcaster is a Farcaster Frame + web UI that turns natural language automation prompts into validated n8n JSON workflows. The app shares the same generation engine across:

- `/frame` – frame metadata (GET) and workflow generation (POST)
- `/api/generate` – JSON API for programmatic workflow generation
- `/api/tip-intent` – produces a Base L2 micro-tip URL
- `/api/deploy` – optional deployment into n8n REST API

### Stack

- Next.js App Router + TypeScript
- OpenAI Responses API (default model `gpt-4o-mini`, override with `OPENAI_AUTOMATION_MODEL`)
- Zod validation + auto-repair cycle
- Edge OG image route for frame previews

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# fill in OPENAI_API_KEY + BASE_TIP_ADDRESS (and optional n8n creds)
npm run dev
```

Visit `http://localhost:3000` for the web client or `http://localhost:3000/frame` for Farcaster frame metadata.

### Environment Variables

`./.env.local.example` lists every supported variable:

- `OPENAI_API_KEY` – required for live generations
- `BASE_TIP_ADDRESS` – Base L2 address used for the 0.0005 tip link
- `OPENAI_AUTOMATION_MODEL` – optional override (defaults to `gpt-4o-mini`)
- `MOCK_OPENAI` – set to `true` to bypass OpenAI calls (used for local testing + frame requests)
- `NEXT_PUBLIC_FLOWCASTER_MOCK` – defaults the client-side checkbox
- `N8N_BASE_URL` / `N8N_API_KEY` – enable `/api/deploy`

## Testing the endpoints

1. `npm run dev`
2. `curl -H "Accept: text/html" http://localhost:3000/frame` – confirms Farcaster metadata.
3. `curl -X POST http://localhost:3000/api/generate -H 'Content-Type: application/json' -d '{"prompt":"Notify me when a Lens mention arrives"}'`
4. `curl http://localhost:3000/api/tip-intent` – returns the Base tip link (requires env values).

Set `MOCK_OPENAI=true` when you want to test frames/API without a live OpenAI key; the service returns a deterministic placeholder workflow that still passes the Zod schema.

## Project Layout

- `app/frame` – GET + POST handlers and OG image route
- `app/api` – REST endpoints (`generate`, `tip-intent`, `deploy`, `workflow`)
- `components/flow-form.tsx` – client UI used on the homepage
- `lib/prompt.ts` – system/user prompts sent to OpenAI
- `lib/schema.ts` – Zod schema for n8n workflows
- `lib/validator.ts` – shared validation helpers
- `lib/workflow.ts` – orchestration (OpenAI call, auto-repair, mock mode)

## Verifying / deploying

```bash
npm run lint    # ESLint via Next
npm run build   # Type-check + production build
npm run start   # Preview production server
```

Deploy to Vercel or any Node.js host; keep the environment variables synchronized across Farcaster + Base tip flows.

## Deploy & Farcaster usage

**Environment variables**

- `OPENAI_API_KEY` – required for real OpenAI generations.
- `BASE_TIP_ADDRESS` – Base chain wallet that receives the 0.0005 tip.
- `NEXT_PUBLIC_FLOWCASTER_BASE_URL` – public base URL (e.g. `https://flowcaster-yourname.vercel.app`).

**Local development**

```bash
npm install
cp .env.local.example .env.local # fill the values above
npm run dev
# In another terminal
curl -s -X POST http://localhost:3000/api/generate \
  -H "content-type: application/json" \
  -d '{"prompt":"draft a mock flow","mock":true}'
curl -s "http://localhost:3000/api/workflow?id=<id>"
# Inspect the viewer
open "http://localhost:3000/w?id=<id>"
```

**Vercel deploy**

1. Create a new Vercel project and import this repo.
2. Configure the env vars above inside Vercel (Project Settings → Environment Variables).
3. Deploy; grab the production URL and set it as `NEXT_PUBLIC_FLOWCASTER_BASE_URL`.

**Warpcast / Farcaster frame**

- Frame endpoint: `https://<prod-domain>/frame`.
- When attached to a cast:
  - Screen 1 → input + "Generate flow" (POSTs to `/frame`).
  - Screen 2 → "Open flow" button (links to `/w?id=<id>` viewer) and "Tip 0.0005" button (Base tip URL controlled by env vars).

