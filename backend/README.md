---
title: VerifyX Backend
emoji: 🔍
colorFrom: blue
colorTo: purple
sdk: docker
app_file: app.py
pinned: false
license: mit
---

# 🔍 VerifyX Backend
Multi-agent AI verification system for content authenticity using FastAPI.

## 🎯 Overview
VerifyX uses four specialized AI agents to verify content authenticity:

1. **Linguistic Agent**: Detects manipulation patterns and sentiment analysis  
2. **Evidence Agent**: Fact-checks claims using Google Fact Check API  
3. **Visual Agent**: Analyzes image-text consistency using CLIP  
4. **Synthesis Agent**: Combines all results into a final verdict  

---

## 📋 Requirements

- Python 3.10+
- FastAPI 0.111.0+
- PyTorch 2.2.2+
- Transformers 4.45.0+
- PIL (Pillow) 10.3.0+
- svglib/reportlab
- httpx
- defusedxml

---

## 🚀 Quick Start

### 1️⃣ Setup Virtual Environment
```bash
cd backend
python -m venv myenv
myenv\Scripts\activate  # Windows
source myenv/bin/activate  # macOS/Linux
```

### 2️⃣ Install Dependencies
```
pip install -r requirements.txt
```

### 3️⃣ Configure Environment

Create a .env file with:
```
ENVIRONMENT=production
ENABLE_TRANSFORMERS=true
ENABLE_TORCH=true
FACT_CHECK_API_KEY=your_google_fact_check_api_key
CORS_ORIGINS=https://verify-x-two.vercel.app,http://localhost:3000
```

### API Endpoints

| Endpoint      | Method | Description                 |
| ------------- | ------ | --------------------------- |
| `/`           | GET    | Root health check           |
| `/health`     | GET    | Health status               |
| `/wake`       | GET    | Wake from sleep             |
| `/warmup`     | GET    | Preload models              |
| `/linguistic` | POST   | Text manipulation/sentiment |
| `/visual`     | POST   | Image-text analysis         |
| `/evidence`   | POST   | Fact-check claim            |
| `/synthesize` | POST   | Combine all agent outputs   |


### Lazy Loading Strategy

All heavy ML models load on-demand to minimize startup time:

- Startup < 5s (no models loaded)
- First request: ~15–20s (models load)
- Subsequent requests: <1s (cached)

### Example Usage
Linguistic Analysis
```
curl -X POST https://redpanda2005-verifyx-backend.hf.space/linguistic \
  -H "Content-Type: application/json" \
  -d '{"text": "Breaking news: Scientists discover cure for all diseases!"}'
```
Evidence Check
```
curl -X POST https://redpanda2005-verifyx-backend.hf.space/evidence \
  -H "Content-Type: application/json" \
  -d '{"text": "The Earth is flat according to new research."}'
```

### Architecture Overview

- app/main.py: FastAPI initialization and CORS setup
- app/services/: Business logic for each AI agent
- app/routes/: REST endpoints
- app/models/: Pydantic request/response models
- scripts/: Debugging utilities for SVGs and images
- tests/: API and service-level tests

### Deployment on Hugging Face Spaces
Steps:

1. Create a new Space → Choose “FastAPI” SDK → Python 3.11

2. Upload your backend files (app.py, requirements.txt, etc.)

3. Add your environment variables under Settings → Variables

Hugging Face will automatically build and deploy

Visit: https://redpanda2005-verifyx-backend.hf.space

### API Docs

- Swagger UI: /docs
- ReDoc: /redoc

### Integration

Frontend (Vercel):
https://verify-x-two.vercel.app

### Dependencies
```
fastapi
uvicorn
torch
transformers
pillow
httpx
svglib
reportlab
defusedxml
```
Built with ❤️ using FastAPI, PyTorch, and Transformers.
Deployed on 🤗 Hugging Face Spaces.