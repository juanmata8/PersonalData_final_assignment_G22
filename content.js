(() => {
  const api = typeof browser !== "undefined" ? browser : chrome;

  const SITE_CONFIGS = {
    chatgpt: {
      hostPatterns: ["chatgpt.com", "chat.openai.com"],
      composerSelectors: [
        "textarea#prompt-textarea",
        "#prompt-textarea[contenteditable='true']",
        "div#prompt-textarea",
        "div[contenteditable='true']"
      ],
      sendButtonSelectors: [
        "button[data-testid='send-button']",
        "button[aria-label*='Send']"
      ],
      assistantSelectors: [
        "[data-message-author-role='assistant']",
        "[data-testid*='conversation-turn'] [data-message-author-role='assistant']"
      ]
    },
    claude: {
      hostPatterns: ["claude.ai"],
      composerSelectors: [
        "div[contenteditable='true']",
        "textarea"
      ],
      sendButtonSelectors: [
        "button[aria-label*='Send']",
        "button[data-testid*='send']"
      ],
      assistantSelectors: [
        "[data-testid='assistant-message']",
        "[data-is-streaming]",
        "[data-testid*='message']"
      ]
    },
    gemini: {
      hostPatterns: ["gemini.google.com"],
      composerSelectors: [
        "textarea",
        "div[contenteditable='true']"
      ],
      sendButtonSelectors: [
        "button[aria-label*='Send']",
        "button[mattooltip*='Send']"
      ],
      assistantSelectors: [
        "message-content",
        ".model-response-text",
        "[data-test-id='response-content']"
      ]
    }
  };

  const siteKey = Object.entries(SITE_CONFIGS).find(([, config]) =>
    config.hostPatterns.some((pattern) => location.hostname.includes(pattern))
  )?.[0];

  if (!siteKey) {
    return;
  }

  const config = SITE_CONFIGS[siteKey];
  let lastSubmissionSignature = "";
  let pendingCapture = null;
  let responsePollTimer = null;
  let stabilityCounter = 0;
  let lastResponseCandidate = "";

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function getTextFromElement(element) {
    if (!element) {
      return "";
    }

    if (element instanceof HTMLTextAreaElement) {
      return element.value || "";
    }

    return element.innerText || element.textContent || "";
  }

  function queryFirst(selectors) {
    for (const selector of selectors) {
      const match = document.querySelector(selector);
      if (match) {
        return match;
      }
    }
    return null;
  }

  function queryAll(selectors) {
    for (const selector of selectors) {
      const matches = Array.from(document.querySelectorAll(selector));
      if (matches.length) {
        return matches;
      }
    }
    return [];
  }

  function getComposerText() {
    const composer = queryFirst(config.composerSelectors);
    return normalizeText(getTextFromElement(composer));
  }

  function getLatestAssistantResponse() {
    const nodes = queryAll(config.assistantSelectors);
    const texts = nodes
      .map((node) => normalizeText(getTextFromElement(node)))
      .filter(Boolean);

    if (!texts.length) {
      return "";
    }

    return texts[texts.length - 1];
  }

  function stopPolling() {
    if (responsePollTimer) {
      clearInterval(responsePollTimer);
      responsePollTimer = null;
    }
  }

  function deliverCapture(responseText, reason) {
    if (!pendingCapture) {
      return;
    }

    const payload = {
      source: siteKey,
      promptText: pendingCapture.promptText,
      responseText: normalizeText(responseText),
      url: location.href,
      timestamp: pendingCapture.timestamp,
      trigger: pendingCapture.trigger,
      captureReason: reason
    };

    api.runtime.sendMessage({ type: "captureInteraction", payload }, () => {
      void api.runtime.lastError;
    });

    pendingCapture = null;
    stopPolling();
    stabilityCounter = 0;
    lastResponseCandidate = "";
  }

  function beginResponsePolling() {
    stopPolling();
    stabilityCounter = 0;
    lastResponseCandidate = "";

    responsePollTimer = window.setInterval(() => {
      if (!pendingCapture) {
        stopPolling();
        return;
      }

      const elapsed = Date.now() - pendingCapture.startedAt;
      const responseText = getLatestAssistantResponse();

      if (responseText && responseText === lastResponseCandidate) {
        stabilityCounter += 1;
      } else if (responseText) {
        stabilityCounter = 1;
        lastResponseCandidate = responseText;
      }

      if (responseText && stabilityCounter >= 2) {
        deliverCapture(responseText, "stable-response");
        return;
      }

      if (elapsed > 20000) {
        deliverCapture(responseText, "timeout");
      }
    }, 1500);
  }

  function queueCapture(trigger) {
    const promptText = getComposerText();
    const cleanPrompt = normalizeText(promptText);
    if (!cleanPrompt) {
      return;
    }

    const signature = `${cleanPrompt}::${Math.floor(Date.now() / 1000)}`;
    if (signature === lastSubmissionSignature) {
      return;
    }

    lastSubmissionSignature = signature;
    pendingCapture = {
      promptText: cleanPrompt,
      trigger,
      timestamp: new Date().toISOString(),
      startedAt: Date.now()
    };

    beginResponsePolling();
  }

  document.addEventListener(
    "submit",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) {
        return;
      }
      queueCapture("submit");
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

      const sendButton = config.sendButtonSelectors.some((selector) => target.closest(selector));
      if (!sendButton) {
        return;
      }

      queueCapture("button");
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

      const composer = queryFirst(config.composerSelectors);
      if (!composer || !composer.contains(target) && composer !== target) {
        return;
      }

      queueCapture("enter");
    },
    true
  );
})();
