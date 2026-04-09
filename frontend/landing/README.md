# VerifyX Landing App

Next.js landing and live demo client for VerifyX.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4

## App Structure

```text
landing/
├── app/
│   ├── page.tsx              # Main marketing + demo page
│   └── privacy/page.tsx      # Privacy page
├── components/               # Hero, demo input, results, etc.
├── lib/api.ts                # Backend API client and retries
└── next.config.ts
```

## Setup

```powershell
cd frontend/landing
npm install
```

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

If not set, `lib/api.ts` defaults to `https://redpanda2005-verifyx-backend.hf.space`.

## Run Commands

```powershell
npm run dev
npm run build
npm run start
npm run lint
```

Open `http://localhost:3000` in your browser.

## Live Demo Flow

The demo input section (`components/InputSection.tsx`) supports:

- required text claim/article input
- optional image upload (base64 conversion client-side)

The API client (`lib/api.ts`) then:

1. pings `GET /wake` with retries (cold-start handling)
2. calls `POST /linguistic`, `POST /evidence`, and optionally `POST /visual` in parallel
3. calls `POST /synthesize` for final verdict

## Expected Backend Endpoints

- `GET /wake`
- `POST /linguistic`
- `POST /evidence`
- `POST /visual`
- `POST /synthesize`

## Deployment

Recommended target: Vercel.

Required environment variable in deployment settings:

- `NEXT_PUBLIC_API_BASE_URL`

Build command:

- `npm run build`

Start command:

- `npm run start`

## Troubleshooting

- If analysis fails immediately, verify backend URL and CORS settings.
- If hosted backend is sleeping, the first request can take longer while wake-up retries run.
