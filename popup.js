const api = typeof browser !== "undefined" ? browser : chrome;
const STORAGE_KEY = "capturedPrompts";

const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");

function formatTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString();
}

async function getPrompts() {
  const result = await api.storage.local.get(STORAGE_KEY);
  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

function render(prompts) {
  countEl.textContent = `Captured prompts: ${prompts.length}`;
  listEl.innerHTML = "";

  if (!prompts.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No prompts captured yet. Open ChatGPT and send a prompt.";
    listEl.appendChild(empty);
    return;
  }

  prompts
    .slice()
    .reverse()
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "item";

      const time = document.createElement("div");
      time.className = "time";
      time.textContent = `${formatTimestamp(item.timestamp)} | ${item.trigger || "unknown"}`;

      const text = document.createElement("div");
      text.className = "text";
      text.textContent = item.text || "";

      card.appendChild(time);
      card.appendChild(text);
      listEl.appendChild(card);
    });
}

async function refresh() {
  try {
    const prompts = await getPrompts();
    render(prompts);
  } catch (error) {
    countEl.textContent = "Failed to read data";
    listEl.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = `Error: ${error.message || error}`;
    listEl.appendChild(empty);
  }
}

async function exportData() {
  const prompts = await getPrompts();
  const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `chatgpt-prompts-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

async function clearData() {
  const ok = confirm("Delete all captured prompts?");
  if (!ok) {
    return;
  }
  await api.storage.local.set({ [STORAGE_KEY]: [] });
  await refresh();
}

refreshBtn.addEventListener("click", refresh);
exportBtn.addEventListener("click", exportData);
clearBtn.addEventListener("click", clearData);

refresh();