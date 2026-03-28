import {
  appendConversation,
  getSourceSettings,
  saveSourceSettings
} from "./src/storage.js";
import { createConversationRecord } from "./src/analysis.js";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSourceSettings();
  await saveSourceSettings(settings);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "captureInteraction" || !message.payload) {
    return false;
  }

  void (async () => {
    try {
      const settings = await getSourceSettings();
      const source = message.payload.source || "captured";

      if (settings[source] === false) {
        sendResponse({ ok: true, ignored: true });
        return;
      }

      const conversation = createConversationRecord(message.payload);
      await appendConversation(conversation);
      sendResponse({ ok: true });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || String(error) });
    }
  })();

  return true;
});
