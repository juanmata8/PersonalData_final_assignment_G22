import {
  clearAllData,
  getConversations,
  getSourceSettings,
  replaceConversations,
  saveImportMetadata,
  saveSourceSettings
} from "./storage.js";
import { analyzeConversations, normalizeConversations } from "./analysis.js";
import { markActiveNav, setStatus } from "./page.js";
import { renderMetricList } from "./charts.js";

markActiveNav("setup");

const csvFileInput = document.getElementById("csvFile");
const importBtn = document.getElementById("importBtn");
const previewWrap = document.getElementById("previewWrap");
const sourceList = document.getElementById("sourceList");
const resetBtn = document.getElementById("resetBtn");
const snapshotCards = document.getElementById("snapshotCards");

let parsedConversations = [];

function syncImportButton() {
  importBtn.disabled = !parsedConversations.length;
}

function renderPreview(conversations) {
  if (!conversations.length) {
    previewWrap.innerHTML = `<div class="empty-state">The JSON file does not contain any valid conversations.</div>`;
    return;
  }

  const limitedRows = conversations.slice(0, 5).map((conversation) => {
    const messageCount = Object.values(conversation.mapping || {}).filter((node) => node?.message).length;
    return {
      id: conversation.id,
      title: conversation.title || "",
      create_time: conversation.create_time,
      update_time: conversation.update_time,
      messages: messageCount
    };
  });

  const headers = Object.keys(limitedRows[0]);
  const table = document.createElement("table");
  table.className = "preview-table";
  table.innerHTML = `
    <thead>
      <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${limitedRows
        .map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`)
        .join("")}
    </tbody>
  `;

  previewWrap.innerHTML = "";
  previewWrap.appendChild(table);
}

async function renderSnapshot() {
  const conversations = await getConversations();
  const sourceSettings = await getSourceSettings();
  const analysis = analyzeConversations(conversations);
  const sourceCountNote = analysis.sourceCounts.length
    ? analysis.sourceCounts.map(([source, count]) => `${source}: ${count}`).join(" | ")
    : "No stored interactions yet";

  renderMetricList(snapshotCards, [
    {
      label: "Stored Conversations",
      value: String(conversations.length),
      note: "Raw conversation export records in local storage"
    },
    {
      label: "Coding Interactions",
      value: String(analysis.totalCodingInteractions),
      note: "Rows currently considered coding-related"
    },
    {
      label: "Sources",
      value: String(analysis.sourceCounts.length || 0),
      note: sourceCountNote
    }
  ]);

  sourceList.innerHTML = "";
  Object.entries(sourceSettings).forEach(([source, enabled]) => {
    const row = document.createElement("div");
    row.className = "source-item";
    row.innerHTML = `
      <div>
        <strong>${source}</strong>
        <p>${enabled ? "Live capture is active when the content script sees a completed exchange." : "Content scripts stay loaded, but the background worker ignores captured exchanges."}</p>
      </div>
      <label class="switch">
        <input type="checkbox" data-source="${source}" ${enabled ? "checked" : ""}>
        <span class="slider"></span>
      </label>
    `;
    sourceList.appendChild(row);
  });

  sourceList.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const nextSettings = await getSourceSettings();
      nextSettings[event.target.dataset.source] = event.target.checked;
      await saveSourceSettings(nextSettings);
      setStatus("resetStatus", "Live capture preferences saved.");
      await renderSnapshot();
    });
  });
}

csvFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    parsedConversations = [];
    syncImportButton();
    renderPreview([]);
    setStatus("importStatus", "The uploaded file is not valid JSON.", true);
    return;
  }

  parsedConversations = normalizeConversations(parsed);
  renderPreview(parsedConversations);
  syncImportButton();
  setStatus("importStatus", `Parsed ${parsedConversations.length} conversation records from the JSON export.`);
});

importBtn.addEventListener("click", async () => {
  if (!parsedConversations.length) {
    return;
  }

  try {
    const existingConversations = await getConversations();
    const mergedById = new Map();

    [...existingConversations, ...parsedConversations].forEach((conversation) => {
      mergedById.set(conversation.id, conversation);
    });

    const merged = Array.from(mergedById.values()).sort((a, b) => {
      const left = a.update_time || a.create_time || 0;
      const right = b.update_time || b.create_time || 0;
      return left - right;
    });
    await replaceConversations(merged);
    await saveImportMetadata({
      importedAt: new Date().toISOString(),
      conversationCount: parsedConversations.length,
      format: "conversations.json"
    });

    setStatus("importStatus", `Imported ${parsedConversations.length} conversation records into local storage.`);
    await renderSnapshot();
  } catch (error) {
    setStatus("importStatus", error.message || String(error), true);
  }
});

resetBtn.addEventListener("click", async () => {
  const confirmed = confirm("Delete all locally stored imported and captured interactions?");
  if (!confirmed) {
    return;
  }

  await clearAllData();
  setStatus("resetStatus", "Local dataset cleared.");
  await renderSnapshot();
});

void renderSnapshot();
