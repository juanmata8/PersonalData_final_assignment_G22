# ChatGPT Prompt Logger (Local)

This is a basic browser extension that runs on ChatGPT pages and captures each prompt you send.

The captured prompts are stored only in browser local storage (`storage.local`).

## Files

- `manifest.json`: Extension config (Manifest V3)
- `content.js`: Detects sends on ChatGPT and stores prompts
- `index.html`: Popup UI
- `popup.js`: Popup logic (view, export, clear)

## Install In Google Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked**.
5. Select this folder:
	`c:\Users\jrodr\OneDrive\Escritorio\repositories\PersonalData_final_assignment_G22\PersonalData_final_assignment_G22`
6. The extension appears as **ChatGPT Prompt Logger (Local)**.
7. Pin it from the Extensions menu if you want quick access.

## Install In Mozilla Firefox

Temporary install (for development/testing):

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select the `manifest.json` file from this folder.
5. The extension loads for the current Firefox session.

Note: Temporary add-ons are removed when Firefox closes.

## How It Works

1. Open ChatGPT (`https://chatgpt.com/` or `https://chat.openai.com/`).
2. Send prompts normally.
3. Open the extension popup.
4. Use:
	- **Refresh** to reload captured prompts.
	- **Export JSON** to download your prompts.
	- **Clear** to delete stored prompts.

## Important Notes

- This extension is intended for your own account and your own prompts.
- ChatGPT UI changes can break selectors in `content.js`. If prompts stop being captured, update selectors.
- Data is local to the browser profile where you installed the extension.

