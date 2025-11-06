# VerifyX - AI-Powered Fake News Detection

A Chrome browser extension that uses a multi-agent AI system to verify content credibility in real-time.

## Features

- 🔤 **Linguistic Analysis** - Detects manipulation patterns in text
- 🔍 **Fact Checking** - Verifies claims against reliable sources
- 👁️ **Deepfake Detection** - Identifies manipulated images
- 🎯 **AI Synthesis** - Combines insights for final verdict
- ⚡ **Real-time Analysis** - Works on any webpage
- 🎨 **Beautiful UI** - Elegant modal with detailed reports

## Installation

### From Source

1. Clone this repository
```bash
git clone <your-repo-url>
cd verifyX
```

2. Configure API endpoints (see Security Setup below)

3. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `verifyX` folder

## Security Setup

**IMPORTANT**: Before deploying, secure your API endpoints:

1. Add authentication to your Google Cloud Functions
2. Create `.env` file (copy from `.env.example`)
3. Use a build tool to inject environment variables
4. Never commit API keys to git

## Usage

1. Browse any social media or news site
2. Click the "Verify Content" button on any post
3. View detailed AI analysis in the modal
4. Check credibility scores and recommendations

## Architecture

```
User clicks "Verify" 
    ↓
Content Script extracts text/images
    ↓
Background Worker calls 4 AI agents in parallel
    ↓
Results displayed in beautiful modal
```

## Supported Platforms

- Twitter/X ✅
- Facebook ✅  
- LinkedIn ✅
- News websites ✅
- Blogs & articles ✅
- Instagram 🚧 (coming soon)
- TikTok 🚧 (coming soon)

## Development

### File Structure
```
verifyX/
├── manifest.json           # Extension configuration
├── background.js           # API orchestration
├── content-beautiful.js    # UI injection & interaction
├── popup.html/js          # Extension popup dashboard
└── README.md
```

### Testing

Use the popup dashboard to test individual agents with custom text.

## Performance

- Parallel agent execution (~2-3s total)
- Fallback mechanisms for failed agents
- Retry logic with exponential backoff
- Intelligent button injection

## Privacy

VerifyX sends text content and images to cloud-based AI agents for analysis. No data is stored permanently. See [Privacy Policy] for details.

## Roadmap

- [ ] Local ML model for preliminary checks
- [ ] Verification history
- [ ] Share results feature
- [ ] Browser extension for Firefox/Edge
- [ ] Video analysis support
- [ ] Batch verification mode

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md] before submitting PRs.

## License

[Your License Here]

## Disclaimer

VerifyX is an AI-assisted tool and should not be the sole source for content verification. Always use critical thinking and multiple sources.
