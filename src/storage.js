export const STORAGE_KEYS = {
  conversations: "llmCodingExplorer.conversations",
  sourceSettings: "llmCodingExplorer.sourceSettings",
  importMetadata: "llmCodingExplorer.importMetadata"
};

export const DEFAULT_SOURCE_SETTINGS = {
  chatgpt: true,
  claude: true,
  gemini: true
};

const MAX_CONVERSATIONS = 3000;

export async function getConversations() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.conversations);
  return Array.isArray(result[STORAGE_KEYS.conversations]) ? result[STORAGE_KEYS.conversations] : [];
}

export async function saveConversations(conversations) {
  const trimmed = Array.isArray(conversations) ? conversations.slice(-MAX_CONVERSATIONS) : [];
  await chrome.storage.local.set({ [STORAGE_KEYS.conversations]: trimmed });
  return trimmed;
}

export async function appendConversation(conversation) {
  const conversations = await getConversations();
  const alreadyExists = conversations.some((item) => item.id === conversation.id);
  if (alreadyExists) {
    return conversations;
  }

  const next = [...conversations, conversation];
  await saveConversations(next);
  return next;
}

export async function replaceConversations(conversations) {
  return saveConversations(conversations);
}

export async function clearAllData() {
  await chrome.storage.local.set({
    [STORAGE_KEYS.conversations]: [],
    [STORAGE_KEYS.importMetadata]: null
  });
}

export async function getSourceSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.sourceSettings);
  return {
    ...DEFAULT_SOURCE_SETTINGS,
    ...(result[STORAGE_KEYS.sourceSettings] || {})
  };
}

export async function saveSourceSettings(settings) {
  const merged = {
    ...DEFAULT_SOURCE_SETTINGS,
    ...(settings || {})
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.sourceSettings]: merged });
  return merged;
}

export async function saveImportMetadata(metadata) {
  await chrome.storage.local.set({ [STORAGE_KEYS.importMetadata]: metadata });
}

export async function getImportMetadata() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.importMetadata);
  return result[STORAGE_KEYS.importMetadata] || null;
}
