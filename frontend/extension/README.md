# VerifyX Chrome Extension

Chrome extension client for VerifyX. It analyzes the active webpage using a four-agent backend pipeline.

## Stack

- React 19
- TypeScript 5
- Vite 7
- TailwindCSS 3
- Chrome Extension Manifest V3

## Folder Layout

```text
extension/
├── public/manifest.json      # MV3 config and permissions
├── src/
│   ├── popup/                # Popup UI (main user flow)
│   ├── content/              # Content script helpers
│   ├── background/           # Service worker
│   ├── components/           # UI components
│   └── utils/                # API client + constants
└── vite.config.ts            # Build setup for extension assets
```

## Setup

```powershell
cd frontend/extension
npm install
```

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If not set, the app falls back to `http://127.0.0.1:8000`.

## Development Commands

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Load Extension In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select `frontend/extension/dist`.

Rebuild after code or env changes, then reload extension from the Extensions page.

## How Verification Works

1. Popup requests active tab content using `chrome.scripting.executeScript`.
2. Extracted text (up to 5000 chars) and up to 5 image URLs are sent to backend.
3. Extension API client runs:
   - `POST /linguistic`
   - `POST /evidence`
   - `POST /visual`
   in parallel, then
   - `POST /synthesize`.
4. Popup renders per-agent cards and final verdict card.

## Permissions and Hosts

Manifest includes:

- Permissions: `activeTab`, `scripting`, `storage`
- Host permissions:
  - `http://127.0.0.1:8000/*`
  - `http://localhost:8000/*`
  - `https://redpanda2005-verifyx-backend.hf.space/*`

## Notes

- `content.js` is registered as a content script for `<all_urls>`.
- Background service worker exists for extension lifecycle and message handling.
- Main analysis flow is triggered from popup UI.
