const pages = [
  { id: "openSetup", path: "setup.html" },
  { id: "openTime", path: "time.html" },
  { id: "openCategories", path: "categories.html" },
  { id: "openSummary", path: "summary.html" }
];

const STORAGE_KEYS = {
  conversations: "llmCodingExplorer.conversations",
  sourceSettings: "llmCodingExplorer.sourceSettings"
};

const DEFAULT_SOURCES = {
  chatgpt: true,
  claude: true,
  gemini: true
};

const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const sourceEl = document.getElementById("sources");

function openPage(path) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
}

async function readDashboardSnapshot() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.conversations,
    STORAGE_KEYS.sourceSettings
  ]);

  const conversations = Array.isArray(result[STORAGE_KEYS.conversations])
    ? result[STORAGE_KEYS.conversations]
    : [];
  const sourceSettings = {
    ...DEFAULT_SOURCES,
    ...(result[STORAGE_KEYS.sourceSettings] || {})
  };

  return { conversations, sourceSettings };
}

function renderSourceSettings(sourceSettings) {
  sourceEl.innerHTML = "";
  Object.entries(sourceSettings).forEach(([source, enabled]) => {
    const badge = document.createElement("span");
    badge.className = `badge ${enabled ? "on" : "off"}`;
    badge.textContent = `${source}: ${enabled ? "on" : "off"}`;
    sourceEl.appendChild(badge);
  });
}

async function renderSnapshot() {
  try {
    const { conversations, sourceSettings } = await readDashboardSnapshot();
    countEl.textContent = `${conversations.length} conversation records stored locally`;
    statusEl.textContent = conversations.length
      ? "Open a page to inspect your usage patterns."
      : "Start in Setup to import a conversation export or enable live capture.";
    renderSourceSettings(sourceSettings);
  } catch (error) {
    countEl.textContent = "Failed to read local data";
    statusEl.textContent = error.message || String(error);
  }
}

pages.forEach((page) => {
  document.getElementById(page.id).addEventListener("click", () => openPage(page.path));
});

renderSnapshot();
