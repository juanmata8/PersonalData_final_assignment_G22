(() => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const STORAGE_KEY = "capturedPrompts";
  const MAX_ITEMS = 500;

  let lastCapturedText = "";
  let lastCapturedAt = 0;

  function normalize(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function getComposerText() {
    const textarea = document.querySelector("textarea#prompt-textarea");
    if (textarea && textarea.value) {
      return textarea.value;
    }

    const editable = document.querySelector("#prompt-textarea[contenteditable='true'], div#prompt-textarea");
    if (editable) {
      return editable.innerText || editable.textContent || "";
    }

    const fallbackEditable = document.querySelector("div[contenteditable='true']");
    if (fallbackEditable) {
      return fallbackEditable.innerText || fallbackEditable.textContent || "";
    }

    return "";
  }

  function shouldSkip(text) {
    const now = Date.now();
    if (!text) {
      return true;
    }

    if (text === lastCapturedText && now - lastCapturedAt < 1200) {
      return true;
    }

    lastCapturedText = text;
    lastCapturedAt = now;
    return false;
  }

  async function savePrompt(text, trigger) {
    const cleanText = normalize(text);
    if (shouldSkip(cleanText)) {
      return;
    }

    const payload = {
      text: cleanText,
      trigger,
      url: location.href,
      timestamp: new Date().toISOString()
    };

    try {
      const result = await api.storage.local.get(STORAGE_KEY);
      const existing = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
      const next = [...existing, payload].slice(-MAX_ITEMS);
      await api.storage.local.set({ [STORAGE_KEY]: next });
    } catch (error) {
      console.error("Prompt logger failed to save prompt", error);
    }
  }

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (!form.closest("main")) {
        return;
      }

      savePrompt(getComposerText(), "submit");
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const sendButton = target.closest("button[data-testid='send-button']");
      if (!sendButton) {
        return;
      }

      savePrompt(getComposerText(), "button");
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const inPromptEditor = target.closest("#prompt-textarea, textarea#prompt-textarea");
      if (!inPromptEditor) {
        return;
      }

      savePrompt(getComposerText(), "enter");
    },
    true
  );
})();