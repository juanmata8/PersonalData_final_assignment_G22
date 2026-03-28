# LLM Coding Explorer

Chrome Manifest V3 extension for analyzing how you use LLMs while coding.

The extension stores imported and live-captured conversations locally in browser storage using a ChatGPT-style `conversations.json` structure, classifies coding-related interactions with transparent heuristics, and visualizes:

- daily interaction counts
- time-of-day and weekday patterns
- coding topic distribution
- frequent words in prompts and responses
- a heuristic cognitive offloading score

The visualization layer uses a vendored local D3.js bundle, so charts remain self-contained inside the extension package.

## Included pages

- `index.html`: Popup launcher
- `setup.html`: `conversations.json` import, source toggles, dataset reset, totals
- `time.html`: Daily, hourly, and weekday usage views
- `categories.html`: Topic chart, word clouds, top terms
- `summary.html`: Score, reflection, recommendation

## Supported live sources

- ChatGPT
- Claude
- Gemini

## Install

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this repository folder.
6. Pin the extension if desired.

## Local-first behavior

- All imported and captured data stays in `chrome.storage.local`.
- No backend and no external APIs are used.
- Site scraping depends on web app DOM structure, so selector updates may be needed if those apps change.

See `EXTENSION_DOCUMENTATION.md` for the data model, analysis rules, and score formula.
