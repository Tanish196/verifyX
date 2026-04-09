# VerifyX Backend

FastAPI backend for VerifyX, a multi-agent content verification pipeline.

## What This Service Does

The backend exposes four agent APIs:

1. Linguistic analysis (`/linguistic`)
2. Evidence verification (`/evidence`)
3. Visual analysis (`/visual`)
4. Final synthesis (`/synthesize`)

Additional operational endpoints are available for health and warmup.

## Tech Stack

- FastAPI 0.111.0
- Uvicorn 0.30.0
- PyTorch (CPU wheels)
- Transformers 4.45.0
- FAISS CPU
- Pillow + SVG rasterization toolchain (`cairosvg`, `svglib`, `reportlab`)
- `defusedxml` for safe SVG parsing

## Project Layout

```text
backend/
├── app.py                    # Runtime entrypoint (HF Spaces friendly)
├── app/
│   ├── main.py               # FastAPI app + middleware + routes
│   ├── config.py             # Env-driven settings
│   ├── models/               # Pydantic request/response schemas
│   ├── routes/               # API routes
│   └── services/             # Agent implementations
├── scripts/                  # Debug and SVG verification scripts
├── tests/                    # Backend test suite
└── requirements.txt
```

## Prerequisites

- Python 3.10+
- pip

## Local Setup

```powershell
cd backend
python -m venv myenv
myenv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

Important variables used in code:

```env
APP_NAME=VerifyX Backend
ENVIRONMENT=development
DEBUG=false

FACT_CHECK_API_KEY=
SERPER_API_KEY=

ENABLE_TRANSFORMERS=true
ENABLE_TORCH=true

CORS_ORIGINS=*
MAX_TEXT_LENGTH=10000
MAX_IMAGES=10
CACHE_DIR=~/.cache/verifyx

# Optional internal protection for debug endpoint
ADMIN_TOKEN=
```

## Run The API

Option 1 (development):

```powershell
cd backend
myenv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Option 2 (entrypoint script used by deployment):

```powershell
cd backend
myenv\Scripts\python.exe app.py
```

## Endpoints

### Operational

- `GET /`
- `GET /health`
- `GET /wake`
- `GET /warmup`
- `OPTIONS /{full_path:path}` (CORS preflight handler)

### Agents

- `POST /linguistic`
- `POST /evidence`
- `POST /visual`
- `POST /synthesize`

### Internal Debug

- `GET /debug/config`
  - returns 404 in production
  - requires `X-Internal-Token` when `ADMIN_TOKEN` is set
  - does not expose raw API keys

## Request Examples

```bash
curl -X POST http://127.0.0.1:8000/linguistic \
  -H "Content-Type: application/json" \
  -d '{"text":"Breaking news: Scientists discover cure for all diseases!"}'
```

```bash
curl -X POST http://127.0.0.1:8000/evidence \
  -H "Content-Type: application/json" \
  -d '{"text":"The Earth is flat according to new research."}'
```

```bash
curl -X POST http://127.0.0.1:8000/visual \
  -H "Content-Type: application/json" \
  -d '{"text":"Photo evidence", "images":["data:image/png;base64,..."]}'
```

## Testing

Run tests:

```powershell
cd backend
myenv\Scripts\python.exe -m pytest -q
```

Current test coverage includes:

- debug endpoint auth and production protection
- evidence log redaction for API key handling
- SVG rasterization behavior and fallback paths
- SVG XXE rejection behavior

## Deployment Notes

This backend is structured for Hugging Face Spaces (`app.py`, `Dockerfile`, `runtime.txt`) and can also run on any container/VM with Python.

After deploy, call `GET /warmup` once to preload models and reduce first-user latency.

## API Docs

- Swagger UI: `/docs`
- ReDoc: `/redoc`