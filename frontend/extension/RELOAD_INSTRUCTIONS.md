# VerifyX Extension - Quick Start Guide

## 🚀 Extension Fixed and Ready to Test!

### What Was Fixed
The popup was displaying as a tiny white box because:
1. ❌ No React mounting code - `Popup.tsx` was just a component without DOM mounting logic
2. ❌ Wrong CSS - `height: 100%` caused sizing issues in extension context
3. ❌ Wrong script reference - `popup.html` pointed to wrong file

All issues are now resolved! ✅

---

## 📋 Reload Instructions (IMPORTANT)

### Option 1: Quick Reload
1. Open `chrome://extensions/`
2. Find **VerifyX**
3. Click the **🔄 Reload** button
4. Test by clicking the extension icon

### Option 2: Full Reload (if Quick Reload doesn't work)
1. Open `chrome://extensions/`
2. Click **Remove** on VerifyX
3. Click **Load unpacked**
4. Select: `c:\TRJ\programming\projects\ml\verifyX\frontend\extension\dist`
5. Click the extension icon to test

---

## ✅ What You Should See Now

### Popup Appearance:
- **Width**: 400 pixels (not tiny!)
- **Background**: Purple-to-blue gradient
- **White card** with rounded corners containing:
  - 🎯 "VerifyX" header (gradient text)
  - 🔵 Large "Verify This Page" button
  - 📊 Three agent cards: Linguistic, Evidence, Visual
  - ✨ Clean, modern UI with proper spacing

### When You Click "Verify This Page":
1. All three agent cards show **spinning loaders**
2. Each card turns **green with checkmark** when complete
3. **Final verdict card** appears at bottom
4. Shows confidence score and verdict

---

## 🔧 Backend Requirement

The extension needs the backend API running. Start it with:

\`\`\`powershell
cd c:\TRJ\programming\projects\ml\verifyX\backend
.\myenv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
\`\`\`

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## 🐛 Troubleshooting

### Still seeing a tiny white box?
1. **Hard refresh**: Remove extension completely and re-add
2. **Check DevTools**: Right-click extension icon → "Inspect popup" → Look for errors in console
3. **Verify files**: Make sure `dist/manifest.json` exists and has correct paths

### Extension loads but verification fails?
1. **Backend not running**: Start backend on port 8000 (see above)
2. **Check backend health**: Visit http://127.0.0.1:8000/docs in browser
3. **CORS issues**: Backend should allow localhost origins

### UI looks broken or unstyled?
1. **CSS not loading**: Check `dist/assets/` folder has CSS files
2. **Rebuild**: Run `npm run build` in extension folder
3. **Clear cache**: Remove and re-add extension

---

## 📁 Key Files Changed

| File | Change |
|------|--------|
| `src/popup/index.tsx` | ✨ NEW - Entry point that mounts Popup component |
| `src/popup/popup.html` | 🔧 Updated script from `popup.tsx` → `index.tsx` |
| `src/index.css` | 🔧 Fixed height/sizing for extension context |
| `src/utils/api.ts` | 🔧 Fixed timeout signal handling + image URLs |
| `src/App.tsx` | 🔧 Fixed AgentId typing + loading status |

---

## 🎯 Testing Checklist

Before reporting any issues, verify:

- [ ] Extension reloaded (or removed/re-added)
- [ ] Backend running on port 8000
- [ ] Backend health check works: http://127.0.0.1:8000/docs
- [ ] Popup opens and shows full UI (400px wide)
- [ ] "Verify This Page" button is visible and clickable
- [ ] Developer console shows no errors (right-click icon → Inspect popup)

---

## 📞 Next Steps

1. **Reload the extension** (see instructions above)
2. **Click the extension icon** - you should see the full UI
3. **Navigate to any webpage** (e.g., news article)
4. **Click "Verify This Page"**
5. **Watch the agents analyze** the content
6. **See the final verdict**

Everything should work now! 🎉
