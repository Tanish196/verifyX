# VerifyX Backend

Multi-agent AI verification system for content authenticity using FastAPI.

## 🎯 Overview

VerifyX uses four specialized AI agents to verify content authenticity:

1. **Linguistic Agent**: Detects manipulation patterns and sentiment analysis
2. **Evidence Agent**: Fact-checks claims using Google Fact Check API
3. **Visual Agent**: Analyzes image-text consistency using CLIP
4. **Synthesis Agent**: Combines all results into a final verdict

## 📋 Requirements

- Python 3.10+
- FastAPI 0.111.0+
- PyTorch 2.2.2+
- Transformers 4.45.0+
- PIL (Pillow) 10.3.0+

## 🚀 Quick Start

### 1. Setup Virtual Environment

```bash
cd backend
python -m venv myenv

# Windows PowerShell
.\myenv\Scripts\Activate.ps1

# Windows CMD
myenv\Scripts\activate.bat

# Linux/Mac
source myenv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file in the backend directory:

```env
# Application Settings
APP_NAME=VerifyX Backend
ENVIRONMENT=development
DEBUG=false

# External APIs
FACT_CHECK_API_KEY=your_google_fact_check_api_key

# Feature Toggles
ENABLE_TRANSFORMERS=true
ENABLE_TORCH=true

# CORS Settings
CORS_ORIGINS=*

# Processing Limits
MAX_TEXT_LENGTH=10000
MAX_IMAGES=10

# Cache Directory
CACHE_DIR=~/.cache/verifyx
```

Important: Do NOT commit your `.env` file or any secrets. A template `.env.example` is included in the repository — copy it to `.env` and fill in real values locally.

### 4. Run the Server

```bash
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --port 8000

# Production mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Server will be available at: http://127.0.0.1:8000

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### Endpoints

#### 1. Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "environment": "development",
  "version": "1.0.0"
}
```

#### 2. Linguistic Analysis
```http
POST /linguistic
Content-Type: application/json

{
  "text": "This shocking discovery will blow your mind!"
}
```

Response:
```json
{
  "dominant_tone": "sensational",
  "sentiment": "positive",
  "manipulation_score": 0.72,
  "signals": [
    {
      "label": "sensational",
      "confidence": 0.85
    }
  ],
  "raw_probs": {
    "manipulative": 0.15,
    "sensational": 0.72,
    "neutral": 0.13
  },
  "latency_ms": 234
}
```

#### 3. Evidence Check
```http
POST /evidence
Content-Type: application/json

{
  "text": "The Earth is flat according to new research."
}
```

Response:
```json
{
  "provider": "google_fact_check",
  "facts_checked": [
    {
      "claim": "The Earth is flat.",
      "verdict": "False",
      "source": "Science Fact Check",
      "url": "https://example.com/fact-check",
      "confidence": 0.95
    }
  ],
  "coverage_ratio": 1.0,
  "overall_accuracy_score": 0.05,
  "latency_ms": 567
}
```

#### 4. Visual Analysis
```http
POST /visual
Content-Type: application/json

{
  "text": "Sunset at the beach",
  "images": ["base64_encoded_image_string"]
}
```

Response:
```json
{
  "provider": "clip",
  "matches": [
    {
      "image_index": 0,
      "similarity": 0.87,
      "likely_deepfake": false
    }
  ],
  "average_similarity": 0.87,
  "latency_ms": 456
}
```

#### 5. Synthesis
```http
POST /synthesize
Content-Type: application/json

{
  "text": "Content to verify",
  "linguistic": { "manipulation_score": 0.3 },
  "evidence": { "overall_accuracy_score": 0.8 },
  "visual": { "average_similarity": 0.75 }
}
```

Response:
```json
{
  "verdict": "likely_true",
  "confidence": 0.84,
  "rationale": "Evidence score=0.80, Visual similarity=0.75, Linguistic score=0.70. Combined score=0.77 -> likely_true.",
  "supporting": {
    "linguistic": { "manipulation_score": 0.3 },
    "evidence": { "overall_accuracy_score": 0.8 },
    "visual": { "average_similarity": 0.75 }
  },
  "latency_ms": 123
}
```

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── linguistic.py
│   │   ├── evidence.py
│   │   ├── visual.py
│   │   └── synth.py
│   ├── routes/              # API endpoints
│   │   ├── __init__.py
│   │   ├── linguistic.py
│   │   ├── evidence.py
│   │   ├── visual.py
│   │   └── synth.py
│   └── services/            # Business logic
│       ├── __init__.py
│       ├── linguistic_service.py
│       ├── evidence_service.py
│       ├── visual_service.py
│       └── synth_service.py
├── myenv/                   # Virtual environment
├── requirements.txt         # Dependencies
├── .env                     # Environment variables
├── README.md               # This file
└── IMPROVEMENTS.md         # Recent improvements
```

## 🔧 Configuration

All configuration is managed through environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | VerifyX Backend | Application name |
| `ENVIRONMENT` | development | Deployment environment |
| `DEBUG` | false | Debug mode |
| `FACT_CHECK_API_KEY` | None | Google Fact Check API key |
| `ENABLE_TRANSFORMERS` | true | Enable ML transformer models |
| `ENABLE_TORCH` | true | Enable PyTorch operations |
| `CORS_ORIGINS` | * | Allowed CORS origins (comma-separated) |
| `MAX_TEXT_LENGTH` | 10000 | Max text length for analysis |
| `MAX_IMAGES` | 10 | Max images to process |
| `CACHE_DIR` | ~/.cache/verifyx | Model cache directory |

## 🧪 Testing

### Manual Testing with cURL

```bash
# Health check
curl http://127.0.0.1:8000/health

# Linguistic analysis
curl -X POST http://127.0.0.1:8000/linguistic \
  -H "Content-Type: application/json" \
  -d '{"text": "This shocking news will amaze you!"}'

# Evidence check
curl -X POST http://127.0.0.1:8000/evidence \
  -H "Content-Type: application/json" \
  -d '{"text": "The moon is made of cheese."}'
```

### Using Postman

1. Import the API endpoints from Swagger UI
2. Set base URL: `http://127.0.0.1:8000`
3. Test each endpoint with sample payloads

## 🚨 Fallback Behavior

The system gracefully handles missing dependencies:

- **No Transformers**: Falls back to keyword-based linguistic analysis
- **No CLIP**: Falls back to random similarity scores
- **No API Key**: Uses mock RAG for evidence checking

## 📝 Development

### Code Quality
- All imports are absolute (`app.config`, not `..config`)
- Comprehensive docstrings for all functions
- Type hints throughout
- Follows FastAPI best practices

### Adding a New Agent

1. Create model in `app/models/new_agent.py`
2. Create service in `app/services/new_agent_service.py`
3. Create route in `app/routes/new_agent.py`
4. Add router to `app/main.py`
5. Export in respective `__init__.py` files

## 🐛 Troubleshooting

### Import Errors
- Ensure you're running from the `backend/` directory
- Check that virtual environment is activated
- Verify Python path: `python -c "import sys; print(sys.path)"`

### SVG rasterization (cairosvg / cairo)

The Visual agent can rasterize SVG inputs using `cairosvg`, which requires native Cairo libraries on the host.

- If you see warnings like "No module named 'cairosvg'" or "no library called 'cairo-2' was found":
  - Install the Python package and native libs:

    Linux (Debian/Ubuntu):
    ```bash
    sudo apt-get update
    sudo apt-get install -y libcairo2 libcairo2-dev
    pip install cairosvg
    ```

    macOS (Homebrew):
    ```bash
    brew install cairo
    pip install cairosvg
    ```

    Windows (MSYS2 recommended):
    - Install MSYS2 (https://www.msys2.org/)
    - In MSYS2 Mingw64 shell:
      ```bash
      pacman -S mingw-w64-x86_64-cairo
      pip install cairosvg
      ```
    - Alternatively, install GTK/cairo runtime DLLs appropriate for your Python build.

- Quick check script:
  ```bash
  python scripts/check_svg_rasterization.py
  ```

If rasterization is unavailable, the service will skip SVG images and continue processing other images. Logs will include a concise install hint with platform-specific commands.

### Model Loading Issues
- Check internet connection (models download on first use)
- Verify `CACHE_DIR` has write permissions
- Set `ENABLE_TRANSFORMERS=false` to use fallback mode

### API Key Issues
- Verify `FACT_CHECK_API_KEY` in `.env`
- Check Google Fact Check API quotas
- System works without API key (uses mock data)

## 📦 Dependencies

Key dependencies:
- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `pydantic`: Data validation
- `transformers`: NLP models
- `torch`: ML framework
- `pillow`: Image processing
- `python-dotenv`: Environment variables

See `requirements.txt` for complete list.

## 🤝 Contributing

1. Follow existing code structure
2. Use absolute imports
3. Add comprehensive docstrings
4. Include type hints
5. Test all endpoints before committing

## 📄 License

This project is part of the VerifyX content verification system.

## 🔗 Related

- Frontend Extension: `../frontend/extension/`
- Landing Page: `../frontend/landing/`
- Documentation: See `/docs` endpoint when server is running
