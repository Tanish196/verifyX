# VerifyX Frontend

This directory contains the frontend projects for VerifyX.

## 📁 Project Structure

```
frontend/
├── extension/          # Chrome Extension (React + TypeScript + Vite)
│   ├── dist/          # Built extension (load this in Chrome)
│   ├── src/           # Source code
│   └── public/        # Static assets
│
└── landing/           # Landing page (Next.js)
    └── app/           # Next.js app directory
```

## 🔧 Projects

### Chrome Extension (`extension/`)
Modern Chrome Extension built with:
- **React 19** + **TypeScript**
- **Vite** for fast builds
- **TailwindCSS** for styling
- Connects to FastAPI backend on `http://127.0.0.1:8000`

**Quick Start:**
```bash
cd extension
npm install
npm run build
```

Then load `extension/dist` as an unpacked extension in Chrome.

See [`extension/RELOAD_INSTRUCTIONS.md`](./extension/RELOAD_INSTRUCTIONS.md) for detailed setup.

### Landing Page (`landing/`)
Marketing/landing page built with Next.js.

**Quick Start:**
```bash
cd landing
npm install
npm run dev
```

## 🚀 Build All Projects

From the frontend root:
```bash
npm run build:all
```

Or individually:
```bash
npm run build:extension
npm run build:landing
```

## 📝 Notes

- The extension requires the backend API running on port 8000
- Old extension files have been removed (they used Google Cloud Functions)
- Current extension uses the local FastAPI backend
