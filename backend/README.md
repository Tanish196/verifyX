---# VerifyX Backend

title: VerifyX Backend

emoji: 🔍Multi-agent AI verification system for content authenticity using FastAPI.

colorFrom: blue

colorTo: purple## 🎯 Overview

sdk: docker

sdk_version: "3.11"VerifyX uses four specialized AI agents to verify content authenticity:

app_file: app.py

pinned: false1. **Linguistic Agent**: Detects manipulation patterns and sentiment analysis

---2. **Evidence Agent**: Fact-checks claims using Google Fact Check API

3. **Visual Agent**: Analyzes image-text consistency using CLIP

# 🔍 VerifyX Backend - Hugging Face Spaces4. **Synthesis Agent**: Combines all results into a final verdict



Multi-agent AI verification system for content authenticity analysis using NLP, computer vision, and fact-checking.## 📋 Requirements



## 🚀 Features- Python 3.10+

- FastAPI 0.111.0+

- **Linguistic Analysis**: Detect manipulation, sentiment, and bias in text using transformers (BART, DistilBERT)- PyTorch 2.2.2+

- **Visual Analysis**: Detect deepfakes and image-text consistency using CLIP- Transformers 4.45.0+

- **Evidence Checking**: Fact-check claims using Google Fact Check API- PIL (Pillow) 10.3.0+

- **Synthesis**: Combine all agents for comprehensive verification reports

## 🚀 Quick Start

## 🌐 API Endpoints

### 1. Setup Virtual Environment

### Core Endpoints

- `GET /` - Root health check```bash

- `GET /health` - Health statuscd backend

- `GET /wake` - Wake from cold startpython -m venv myenv

- `GET /warmup` - Preload all models (call after deployment for faster responses)

# Windows PowerShell

### Analysis Endpoints.\myenv\Scripts\Activate.ps1

- `POST /linguistic` - Analyze text for manipulation and sentiment

- `POST /visual` - Analyze images for deepfakes and consistency# Windows CMD

- `POST /evidence` - Fact-check claims against web sourcesmyenv\Scripts\activate.bat

- `POST /synthesize` - Complete verification combining all agents

# Linux/Mac

## 📝 Example Usagesource myenv/bin/activate

```

### Linguistic Analysis

```bash### 2. Install Dependencies

curl -X POST https://YOUR-USERNAME-verifyx.hf.space/linguistic \

  -H "Content-Type: application/json" \```bash

  -d '{"text": "Breaking news: Scientists discover cure for all diseases!"}'pip install -r requirements.txt

``````



### Visual Analysis### 3. Configure Environment

```bash

curl -X POST https://YOUR-USERNAME-verifyx.hf.space/visual \Create a `.env` file in the backend directory:

  -H "Content-Type: application/json" \

  -d '{```env

    "text": "Photo of the moon landing",# Application Settings

    "images": ["base64_encoded_image_here"]APP_NAME=VerifyX Backend

  }'ENVIRONMENT=development

```DEBUG=false



### Synthesis (Full Verification)# External APIs

```bashFACT_CHECK_API_KEY=your_google_fact_check_api_key

curl -X POST https://YOUR-USERNAME-verifyx.hf.space/synthesize \

  -H "Content-Type: application/json" \# Feature Toggles

  -d '{ENABLE_TRANSFORMERS=true

    "text": "Climate change is a hoax invented by scientists",ENABLE_TORCH=true

    "images": []

  }'# CORS Settings

```# Recommended: include your deployed frontend origin(s). Example allows the Vercel landing

# and local development on localhost:3000. In production, restrict this to only trusted origins.

## 🔧 ConfigurationCORS_ORIGINS=https://verify-x-two.vercel.app,http://127.0.0.1:3000



### Required Secrets (Set in Hugging Face Spaces Settings)# Processing Limits

MAX_TEXT_LENGTH=10000

Go to **Settings** → **Repository secrets** and add:MAX_IMAGES=10



1. `FACT_CHECK_API_KEY` - Google Fact Check API key (optional, for evidence checking)# Cache Directory

2. `ENVIRONMENT` - Set to `production`CACHE_DIR=~/.cache/verifyx

```

### Optional Settings

- `ENABLE_TRANSFORMERS` - Enable/disable ML models (default: `true`)Important: Do NOT commit your `.env` file or any secrets. A template `.env.example` is included in the repository — copy it to `.env` and fill in real values locally.

- `ENABLE_TORCH` - Enable/disable PyTorch operations (default: `true`)

### 4. Run the Server

## 🏗️ Architecture

```bash

### Lazy Loading Strategy# Development mode with auto-reload

All heavy ML models use lazy loading to optimize startup and memory:python -m uvicorn app.main:app --reload --port 8000

- **Cold start**: Server starts in <5 seconds without loading models

- **First request**: Models load on-demand (~15-20 seconds)# Production mode

- **Subsequent requests**: Cached models respond in <1 secondpython -m uvicorn app.main:app --host 0.0.0.0 --port 8000

```

### Services

1. **Linguistic Service** - NLP analysis with BART and DistilBERTServer will be available at: http://127.0.0.1:8000

2. **Visual Service** - Image analysis with CLIP and PIL

3. **Evidence Service** - Fact-checking with Google API## 📚 API Documentation

4. **Synthesis Service** - Combines all agent outputs

### Interactive Documentation

## 🔗 Integration- **Swagger UI**: http://127.0.0.1:8000/docs

- **ReDoc**: http://127.0.0.1:8000/redoc

### Frontend

This backend powers the VerifyX frontend hosted on Vercel:### Endpoints

- **Production**: https://verify-x-two.vercel.app

#### 1. Health Check

### CORS Configuration```http

Pre-configured to accept requests from:GET /health

- `https://verify-x-two.vercel.app` (production)```

- `http://localhost:3000` (local Next.js)

- `http://localhost:5173` (local Vite)Response:

```json

## 🧪 Local Development{

  "status": "ok",

### Prerequisites  "environment": "development",

- Python 3.11  "version": "1.0.0"

- pip}

```

### Setup

```bash#### 2. Linguistic Analysis

cd backend```http

pip install -r requirements.txtPOST /linguistic

```Content-Type: application/json



### Run locally{

```bash  "text": "This shocking discovery will blow your mind!"

# Using the Hugging Face Spaces entry point}

python app.py```



# Or using uvicorn directlyResponse:

uvicorn app.main:app --reload --port 7860```json

```{

  "dominant_tone": "sensational",

### Test endpoints  "sentiment": "positive",

```bash  "manipulation_score": 0.72,

# Health check  "signals": [

curl http://localhost:7860/health    {

      "label": "sensational",

# Warmup models      "confidence": 0.85

curl http://localhost:7860/warmup    }

  ],

# Test linguistic analysis  "raw_probs": {

curl -X POST http://localhost:7860/linguistic \    "manipulative": 0.15,

  -H "Content-Type: application/json" \    "sensational": 0.72,

  -d '{"text": "This is suspicious fake news!"}'    "neutral": 0.13

```  },

  "latency_ms": 234

## 📊 Performance Metrics}

```

| Metric | Value |

|--------|-------|#### 3. Evidence Check

| Startup time | <5 seconds (no model loading) |```http

| Warmup time | 15-30 seconds (one-time) |POST /evidence

| Response time | <1 second (post-warmup) |Content-Type: application/json

| Memory usage | ~2GB (all models loaded) |

{

## 🛡️ Security Features  "text": "The Earth is flat according to new research."

}

- ✅ CORS protection for cross-origin requests```

- ✅ Input validation on all endpoints

- ✅ XXE protection for SVG processing (defusedxml)Response:

- ✅ Environment variables for sensitive data```json

- ✅ No hardcoded credentials{

  "provider": "google_fact_check",

## 📚 Tech Stack  "facts_checked": [

    {

- **FastAPI** - Modern Python web framework      "claim": "The Earth is flat.",

- **PyTorch (CPU)** - Deep learning inference      "verdict": "False",

- **Transformers** - NLP models (BART, DistilBERT, CLIP)      "source": "Science Fact Check",

- **Pillow** - Image processing      "url": "https://example.com/fact-check",

- **svglib/reportlab** - SVG/PDF rendering      "confidence": 0.95

- **httpx** - Async HTTP client    }

- **defusedxml** - Secure XML parsing  ],

  "coverage_ratio": 1.0,

## 🚀 Deployment on Hugging Face Spaces  "overall_accuracy_score": 0.05,

  "latency_ms": 567

### Step 1: Create a New Space}

1. Go to https://huggingface.co/spaces```

2. Click "Create new Space"

3. Choose "Docker" as SDK#### 4. Visual Analysis

4. Set Python version to 3.11```http

POST /visual

### Step 2: Upload FilesContent-Type: application/json

Upload these files to your Space:

```{

backend/  "text": "Sunset at the beach",

├── app.py                 # Hugging Face entry point  "images": ["base64_encoded_image_string"]

├── requirements.txt       # Dependencies}

├── runtime.txt           # Python version```

├── README.md             # This file (with metadata header)

└── app/Response:

    ├── __init__.py```json

    ├── main.py           # FastAPI app{

    ├── config.py         # Configuration  "provider": "clip",

    ├── models/           # Pydantic models  "matches": [

    ├── routes/           # API endpoints    {

    └── services/         # AI agents      "image_index": 0,

```      "similarity": 0.87,

      "likely_deepfake": false

### Step 3: Configure Secrets    }

In Space settings, add:  ],

- `FACT_CHECK_API_KEY` (optional)  "average_similarity": 0.87,

- `ENVIRONMENT=production`  "latency_ms": 456

}

### Step 4: Wait for Build```

The Space will automatically:

1. Install dependencies from requirements.txt#### 5. Synthesis

2. Start the app using app.py```http

3. Expose the API on port 7860POST /synthesize

Content-Type: application/json

### Step 5: Call Warmup

After deployment, call the warmup endpoint once:{

```bash  "text": "Content to verify",

curl https://YOUR-USERNAME-verifyx.hf.space/warmup  "linguistic": { "manipulation_score": 0.3 },

```  "evidence": { "overall_accuracy_score": 0.8 },

  "visual": { "average_similarity": 0.75 }

This preloads all models for faster subsequent requests.}

```

## 📖 API Documentation

Response:

Once deployed, access interactive API documentation at:```json

- **Swagger UI**: https://YOUR-USERNAME-verifyx.hf.space/docs{

- **ReDoc**: https://YOUR-USERNAME-verifyx.hf.space/redoc  "verdict": "likely_true",

  "confidence": 0.84,

## 🤝 Frontend Integration  "rationale": "Evidence score=0.80, Visual similarity=0.75, Linguistic score=0.70. Combined score=0.77 -> likely_true.",

  "supporting": {

The VerifyX frontend is configured to use this backend. Update the API URL in the frontend:    "linguistic": { "manipulation_score": 0.3 },

    "evidence": { "overall_accuracy_score": 0.8 },

```typescript    "visual": { "average_similarity": 0.75 }

// In frontend/landing/lib/api.ts  },

const API_URL = "https://YOUR-USERNAME-verifyx.hf.space";  "latency_ms": 123

```}

```

## 🔍 Monitoring & Logs

## 🏗️ Project Structure

View logs in the Hugging Face Spaces interface:

- Click on "Logs" tab in your Space```

- Look for startup messages:backend/

  ```├── app/

  🚀 Starting VerifyX on Hugging Face Spaces│   ├── __init__.py

  📍 Running on http://0.0.0.0:7860│   ├── main.py              # FastAPI application entry point

  ✅ Server ready - awaiting requests│   ├── config.py            # Configuration management

  ```│   ├── models/              # Pydantic models

│   │   ├── __init__.py

## 🐛 Troubleshooting│   │   ├── linguistic.py

│   │   ├── evidence.py

### Models not loading│   │   ├── visual.py

- Check logs for `[LAZY LOAD]` messages│   │   └── synth.py

- Call `/warmup` endpoint to preload models│   ├── routes/              # API endpoints

- Verify `ENABLE_TRANSFORMERS=true` in settings│   │   ├── __init__.py

│   │   ├── linguistic.py

### CORS errors│   │   ├── evidence.py

- Verify frontend URL is in `allowed_origins` (main.py)│   │   ├── visual.py

- Check browser console for specific CORS errors│   │   └── synth.py

- Ensure OPTIONS preflight requests return 200│   └── services/            # Business logic

│       ├── __init__.py

### Slow responses│       ├── linguistic_service.py

- First request may be slow (model loading)│       ├── evidence_service.py

- Call `/warmup` after deployment│       ├── visual_service.py

- Subsequent requests should be <1s│       └── synth_service.py

├── myenv/                   # Virtual environment

### Memory errors├── requirements.txt         # Dependencies

- Hugging Face Spaces provides sufficient memory├── .env                     # Environment variables

- Models use CPU inference (no GPU needed)├── README.md               # This file

- Lazy loading prevents memory spikes└── IMPROVEMENTS.md         # Recent improvements

```

## 📄 License

## 🔧 Configuration

See LICENSE file in the main repository.

All configuration is managed through environment variables in `.env`:

## 🔗 Links

| Variable | Default | Description |

- **Frontend**: https://verify-x-two.vercel.app|----------|---------|-------------|

- **Repository**: https://github.com/Tanish196/verifyX| `APP_NAME` | VerifyX Backend | Application name |

- **API Docs**: https://YOUR-USERNAME-verifyx.hf.space/docs| `ENVIRONMENT` | development | Deployment environment |

| `DEBUG` | false | Debug mode |

---| `FACT_CHECK_API_KEY` | None | Google Fact Check API key |

| `ENABLE_TRANSFORMERS` | true | Enable ML transformer models |

**Built with ❤️ using FastAPI, PyTorch, and Transformers**  | `ENABLE_TORCH` | true | Enable PyTorch operations |

**Deployed on 🤗 Hugging Face Spaces**| `CORS_ORIGINS` | https://verify-x-two.vercel.app | Allowed CORS origins (comma-separated) |

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
