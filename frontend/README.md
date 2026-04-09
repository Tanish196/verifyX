# VerifyX Frontend

This folder contains all VerifyX web clients:

1. `extension/`: Chrome extension (Manifest V3, React + Vite)
2. `landing/`: Next.js landing/demo app

## Workspace Structure

```text
frontend/
├── package.json              # Workspace scripts (build all / per app)
├── extension/                # Browser extension app
└── landing/                  # Next.js app
```

## Prerequisites

- Node.js 18+
- npm
- Backend API running (local or hosted)

## Install Dependencies

Install each app separately:

```powershell
cd frontend/extension
npm install

cd ../landing
npm install
```

## Environment Configuration

### Extension

Create `frontend/extension/.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The extension defaults to `http://127.0.0.1:8000` when env is not set.

### Landing

Create `frontend/landing/.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

The landing app code defaults to a hosted backend if this variable is not set.

## Workspace Scripts

From `frontend/`:

```powershell
npm run build:extension
npm run build:landing
npm run build:all
```

## Extension App (`frontend/extension`)

Tech stack:

- React 19 + TypeScript
- Vite 7
- TailwindCSS 3
- Chrome Extension Manifest V3

Commands:

```powershell
cd frontend/extension
npm run dev
npm run build
npm run lint
```

Load in browser:

1. Build with `npm run build`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Load unpacked from `frontend/extension/dist`

Runtime notes:

- Uses `chrome.scripting.executeScript` to collect active tab text/images.
- Calls backend endpoints `/linguistic`, `/evidence`, `/visual`, and `/synthesize`.
- Manifest host permissions include localhost and hosted backend URLs.

## Landing App (`frontend/landing`)

Tech stack:

- Next.js 16 (App Router)
- React 19
- TailwindCSS 4
- TypeScript

Commands:

```powershell
cd frontend/landing
npm run dev
npm run build
npm run start
npm run lint
```

Runtime notes:

- Demo form in `components/InputSection.tsx` posts text and optional image to backend.
- API client in `lib/api.ts` performs wake checks and retries before analysis calls.

## Integration Contract

Both frontend apps expect backend routes:

- `GET /wake`
- `POST /linguistic`
- `POST /evidence`
- `POST /visual`
- `POST /synthesize`

## Troubleshooting

- If extension/landing cannot connect, verify backend URL env vars and CORS settings.
- If hosted backend is asleep, first request may take longer; landing client already pings `/wake`.
- Rebuild extension after any manifest or environment changes.
