# VerifyX

VerifyX is a multi-agent content verification system with:

- a FastAPI backend for linguistic, evidence, visual, and synthesis analysis
- a Chrome extension (React + TypeScript + Vite)
- a public landing/demo app (Next.js)

This README was rebuilt from the current codebase and validated with real test/build runs.

Project-specific docs:

- `backend/README.md`
- `frontend/README.md`
- `frontend/extension/README.md`
- `frontend/landing/README.md`

## Monorepo Layout

```text
verifyX/
├── backend/                  # FastAPI + ML services
│   ├── app/main.py           # API app + routes + CORS + health/warmup
│   ├── app/routes/           # /linguistic /evidence /visual /synthesize
│   ├── app/services/         # core agent logic
│   └── tests/                # backend tests (security + SVG + debug)
├── frontend/
│   ├── extension/            # Chrome extension (MV3, Vite)
│   └── landing/              # Next.js landing/demo app
└── README.md
```

## Verification Status

Validated on 2026-04-09 (Windows):

1. Backend tests: `12 passed`.
2. Extension build: `npm run build` successful.
3. Landing build: `npm run build` successful.

During verification, a backend bug in SVG image handling was fixed:

- `backend/app/services/visual_service.py`: corrected lazy PIL usage (`PILImage` reference in SVG decode path).

## Architecture

### Backend Agents

1. `linguistic`:
    - Zero-shot manipulation/tone classification + sentiment fallback.
2. `evidence`:
    - Google Fact Check API when available.
    - Fallback pipeline: Serper search -> FAISS retrieval -> cross-encoder rerank -> stance + source credibility.
3. `visual`:
    - CLIP similarity for text-image consistency.
    - Supports base64, URLs, and SVG rasterization with safe XML parsing (`defusedxml`).
4. `synthesize`:
    - Weighted final verdict from other agent outputs.

### Request Flow

```text
User input (text + optional images)
  -> linguistic/evidence/visual in parallel
  -> synthesize final verdict
  -> result rendered in extension or landing UI
```

## Prerequisites

- Python 3.10+ (3.12 used in current backend venv)
- Node.js 18+
- npm
- Chrome/Chromium (for extension testing)

## Quick Start

### 1. Backend Setup

```powershell
cd backend
python -m venv myenv
myenv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example` and set:

```env
FACT_CHECK_API_KEY=...
SERPER_API_KEY=...
ENABLE_TRANSFORMERS=true
ENABLE_TORCH=true
CORS_ORIGINS=*
MAX_TEXT_LENGTH=10000
MAX_IMAGES=10
CACHE_DIR=~/.cache/verifyx
```

Run API locally:

```powershell
cd backend
myenv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Extension Setup

```powershell
cd frontend/extension
npm install
```

Create `frontend/extension/.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Build extension:

```powershell
npm run build
```

Load unpacked extension from `frontend/extension/dist` in `chrome://extensions` (Developer mode).

### 3. Landing App Setup

```powershell
cd frontend/landing
npm install
npm run dev
```

For API target, set:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Backend API

Base URL (local): `http://127.0.0.1:8000`

### Health

- `GET /`
- `GET /health`
- `GET /wake`
- `GET /warmup`

### Agents

- `POST /linguistic`
- `POST /evidence`
- `POST /visual`
- `POST /synthesize`

Example request payloads:

```json
{ "text": "Scientists discovered a cure for all diseases." }
```

```json
{
  "text": "This image proves the claim.",
  "images": ["data:image/png;base64,..."]
}
```

## Useful Commands

From `backend/`:

```powershell
myenv\Scripts\python.exe -m pytest -q
```

From `frontend/extension/`:

```powershell
npm run build
```

From `frontend/landing/`:

```powershell
npm run build
```

From `frontend/`:

```powershell
npm run build:all
```

## Documentation Scope

All tracked README files in this repository are now aligned to the current codebase and runtime behavior:

1. Root overview and cross-project setup (`README.md`)
2. Backend implementation, endpoints, env, and tests (`backend/README.md`)
3. Frontend workspace and integration (`frontend/README.md`)
4. Extension runtime and permissions (`frontend/extension/README.md`)
5. Landing app demo flow and deployment (`frontend/landing/README.md`)

## Notes and Known Warnings

- Backend tests pass, but pytest emits non-blocking deprecation warnings from third-party libraries (`fastapi`, `reportlab`, `faiss`, etc.).
- Landing build reports a non-blocking warning about multiple lockfiles in the workspace.

## Security Notes

- Do not commit `.env` files.
- Keep `FACT_CHECK_API_KEY` and `SERPER_API_KEY` server-side only.
- `GET /debug/config` is disabled in production and can require `X-Internal-Token` if `ADMIN_TOKEN` is set.
- SVG handling uses `defusedxml` to reject unsafe XML content.

## Disclaimer

VerifyX provides AI-assisted signals, not definitive truth guarantees. Treat outputs as decision support and cross-check high-impact claims with trusted sources.
