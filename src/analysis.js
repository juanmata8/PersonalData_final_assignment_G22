const CODING_TERMS = [
  "bug", "debug", "error", "stack trace", "exception", "function", "class", "method", "variable",
  "typescript", "javascript", "python", "java", "csharp", "react", "node", "sql", "api", "json",
  "css", "html", "test", "refactor", "compile", "build", "deploy", "docker", "git", "query",
  "schema", "regex", "frontend", "backend", "package", "module", "component",
  "algorithm", "endpoint", "repository", "branch", "lint", "npm", "yarn", "pnpm", "vite", "webpack"
];

const CODING_CONTEXT_PATTERNS = [
  /```/,
  /\b[a-z0-9_-]+\.(js|ts|tsx|jsx|py|java|rb|go|rs|sql|css|html|json|md)\b/i,
  /\b(line|column) \d+\b/i,
  /\b(http|runtime|syntax|type|reference) error\b/i,
  /\bunit test|integration test|test case\b/i
];

// Prompts where the user is asking the model to DO something (produce output, take action).
const DELEGATION_TERMS = [
  "fix", "make", "write", "implement", "refactor", "generate", "create",
  "do", "update", "optimize", "add", "build", "draft", "produce", "rewrite"
];

// Prompts where the user is asking the model to EXPLAIN something.
const EXPLANATION_TERMS = [
  "explain", "why", "how does", "what is", "teach", "describe", "clarify", "walk through"
];

// Output types the user is explicitly requesting — signals a concrete implementation ask.
const OUTPUT_TYPE_TERMS = [
  "function", "component", "file", "query", "patch", "test", "script", "class", "endpoint"
];

const CONCEPTUAL_TERMS = [
  "concept", "theory", "definition", "meaning", "overview", "difference", "compare"
];

const TOPIC_RULES = {
  debugging: ["bug", "debug", "error", "stack trace", "exception", "fix failing", "trace"],
  "code generation": ["write code", "generate", "implement", "create function", "scaffold", "build"],
  refactoring: ["refactor", "clean up", "simplify", "rename", "improve structure"],
  explanation: ["explain", "why", "how does", "teach", "clarify", "walk through"],
  testing: ["test", "unit test", "integration test", "jest", "vitest", "coverage"],
  "tooling/environment": ["docker", "npm", "yarn", "pnpm", "webpack", "vite", "install", "environment"],
  "architecture/design": ["architecture", "design", "pattern", "abstraction", "system", "tradeoff"],
  "data/querying": ["sql", "query", "database", "schema", "migration", "join", "orm"]
};

// Words that carry no signal for frequency analysis.
// Contractions are normalised before tokenization, so only post-strip forms appear here.
const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "your", "into", "about", "there",
  "would", "could", "should", "what", "when", "where", "which", "while", "please", "thanks", "need",
  "can", "you", "are", "not", "but", "use", "example", "question", "run", "current", "yet", "get", "all",
  "help", "using", "used", "user", "users", "assistant", "response", "prompt", "chatgpt", "claude",
  "gemini", "just", "than", "them", "then", "their", "will", "were", "been", "being", "also", "here",
  "code", "coding", "project", "want", "they", "very", "some", "more", "most",
  "does", "like", "each", "after", "before", "because", "through", "over",
  "under", "able", "count", "counts", "generated", "locally", "browser", "extension", "data",
  // contraction forms that survive apostrophe stripping (e.g. "don't" → "dont")
  "dont", "cant", "wont", "isnt", "arent", "wasnt", "werent", "hasnt", "havent", "didnt",
  "wouldnt", "couldnt", "shouldnt", "ive", "youre", "thats", "its", "im", "id", "ill"
]);

// ---------------------------------------------------------------------------
// Word quality scores
// Positive = exploration / learning-oriented (green)
// Negative = offloading / delegation-oriented (red)
// ---------------------------------------------------------------------------
export const WORD_QUALITY_SCORES = {
  // =========================================
  // STRONG OFFLOADING → RED (-2)
  // Direct delegation / asking AI to do work
  // =========================================
  fix: -2,
  generate: -2,
  write: -2,
  implement: -2,
  create: -2,
  build: -2,
  make: -2,
  produce: -2,
  draft: -2,
  rewrite: -2,
  add: -2,
  update: -2,
  complete: -2,
  finish: -2,
  solve: -2,
  provide: -2,
  give: -2,
  deliver: -2,
  convert: -2,
  replace: -2,
  improve: -2,
  optimize: -2,
  automate: -2,
  generatecode: -2,
  scaffold: -2,
  patch: -2,
  codeit: -2,
  do: -2,
  handle: -2,
  setup: -2,
  configure: -2,
  deploy: -2,
  install: -2,
  refactor: -2,
  debug: -2,
  debugthis: -2,
  resolve: -2,
  repair: -2,
  correct: -2,
  fill: -2,
  finishthis: -2,

  // =========================================
  // MILD OFFLOADING → ORANGE (-1)
  // Concrete output requests
  // =========================================
  function: -1,
  file: -1,
  script: -1,
  class: -1,
  component: -1,
  endpoint: -1,
  method: -1,
  module: -1,
  package: -1,
  api: -1,
  query: -1,
  schema: -1,
  migration: -1,
  test: -1,
  testcase: -1,
  unittest: -1,
  integrationtest: -1,
  hook: -1,
  service: -1,
  repository: -1,
  controller: -1,
  handler: -1,
  middleware: -1,
  route: -1,
  config: -1,
  configuration: -1,
  dockerfile: -1,
  pipeline: -1,
  workflow: -1,
  ci: -1,
  cd: -1,
  yaml: -1,
  json: -1,
  sql: -1,
  regex: -1,
  parser: -1,
  validator: -1,
  serializer: -1,
  mapper: -1,
  adapter: -1,
  interface: -1,
  abstraction: -1,
  architecture: -1,

  // =========================================
  // MILD EXPLORATION → LIGHT GREEN (+1)
  // Asking to understand / compare
  // =========================================
  compare: 1,
  difference: 1,
  describe: 1,
  overview: 1,
  concept: 1,
  theory: 1,
  meaning: 1,
  definition: 1,
  clarify: 1,
  discuss: 1,
  summarize: 1,
  summary: 1,
  explaination: 1,
  interpretation: 1,
  reason: 1,
  reasons: 1,
  analyze: 1,
  analysis: 1,
  evaluate: 1,
  tradeoff: 1,
  tradeoffs: 1,
  pros: 1,
  cons: 1,
  advantage: 1,
  disadvantages: 1,
  benefits: 1,
  alternatives: 1,
  comparison: 1,
  distinctions: 1,
  intuition: 1,
  principles: 1,
  approach: 1,
  strategy: 1,
  patterns: 1,
  pattern: 1,
  bestpractice: 1,
  guideline: 1,
  guidelines: 1,

  // =========================================
  // STRONG EXPLORATION → GREEN (+2)
  // Learning-oriented prompts
  // =========================================
  explain: 2,
  why: 2,
  how: 2,
  teach: 2,
  walkthrough: 2,
  understand: 2,
  understanding: 2,
  reasoning: 2,
  reasonabout: 2,
  learn: 2,
  learning: 2,
  study: 2,
  clarifythis: 2,
  elaborate: 2,
  elaborateon: 2,
  detail: 2,
  details: 2,
  intuitionbehind: 2,
  howdoes: 2,
  whatis: 2,
  whenuse: 2,
  whenshould: 2,
  whenwould: 2,
  whydoes: 2,
  whyshould: 2,
  whywould: 2,
  teachme: 2,
  helpmeunderstand: 2,
  tellmemore: 2,
  deeper: 2,
  deeply: 2,
  explore: 2,
  exploration: 2
};

// ---------------------------------------------------------------------------
// Color palette for word quality scores
// ---------------------------------------------------------------------------
const WORD_COLORS = {
  strong_offloading:  "#ef4444", // red-500     — score === -2
  mild_offloading:    "#f97316", // orange-500  — score === -1
  neutral:            "#94a3b8", // slate-400   — score === 0 / unknown
  mild_exploration:   "#86efac", // green-300   — score === +1
  strong_exploration: "#22c55e", // green-500   — score === +2
};

/**
 * Returns a CSS color string for a word based on its quality score.
 * Words absent from WORD_QUALITY_SCORES are treated as neutral.
 *
 * @param {string} word
 * @returns {string} CSS color
 */
export function getWordColor(word) {
  const score = WORD_QUALITY_SCORES[word.toLowerCase()] ?? 0;
  if (score <= -2) return WORD_COLORS.strong_offloading;
  if (score === -1) return WORD_COLORS.mild_offloading;
  if (score === 0)  return WORD_COLORS.neutral;
  if (score === 1)  return WORD_COLORS.mild_exploration;
  return WORD_COLORS.strong_exploration; // score >= 2
}

/**
 * Returns the numeric quality score for a word (0 if unknown).
 *
 * @param {string} word
 * @returns {number}
 */
export function getWordScore(word) {
  return WORD_QUALITY_SCORES[word.toLowerCase()] ?? 0;
}

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractPartsText(content) {
  if (!content || !Array.isArray(content.parts)) {
    return "";
  }

  return content.parts
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("\n");
}

function normalizeWhitespace(value) {
  return safeString(value).replace(/\s+/g, " ").trim();
}

function buildId(source, timestamp, promptText, responseText) {
  const seed = `${source}|${timestamp}|${promptText}|${responseText}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `interaction-${hash.toString(16)}`;
}

function includesKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function countKeywords(text, keywords) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function normalizeDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    const dateFromNumber = new Date(milliseconds);
    if (!Number.isNaN(dateFromNumber.getTime())) {
      return dateFromNumber.toISOString();
    }
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  // Return null on failure — callers decide the fallback so bad timestamps
  // don't silently pollute time-series charts with today's date.
  return null;
}

// Split camelCase and PascalCase tokens into their constituent words.
// "handleSubmit" → ["handle", "submit"]
// "useState"     → ["use", "state"]
// "fetchUserData"→ ["fetch", "user", "data"]
// Pure lowercase or ALL_CAPS tokens are returned as-is.
function splitCamelCase(word) {
  // Insert a separator before any uppercase letter that follows a lowercase letter
  // or before an uppercase letter followed by a lowercase letter (handles acronyms).
  return word
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(" ")
    .filter(Boolean);
}

export function tokenizeText(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    // Normalise apostrophes (curly and straight) before stripping so
    // "don't" → "dont" hits the stopword rather than becoming noise.
    .replace(/[''`]/g, "")
    // Keep word characters plus the symbols that are meaningful in code identifiers.
    .replace(/[^a-z0-9_#+.\-\s]/g, " ")
    .split(/\s+/)
    // Split any surviving camelCase tokens — this runs on already-lowercased text
    // so it only catches mixed-case leftovers from the original (e.g. identifiers
    // preserved through the replace). Pass each word through splitCamelCase in case
    // the original had mixed case before lowercasing compressed it — realistically
    // this mostly catches underscore_separated and already-lowercase terms, and that
    // is fine; the camelCase splitting happens on the original text below.
    .flatMap((word) => (word.length > 2 && !STOPWORDS.has(word) ? [word] : []))
    // Second pass: re-process the original text for camelCase identifiers before
    // lowercasing nukes the boundaries, then merge with the token list.
    // We do this by also tokenizing the original (pre-lowercase) text separately.
    // See the companion pass in tokenizeTextWithCamelCase below.
    ;
}

// Full tokenizer that preserves camelCase splitting from the original text.
// tokenizeText is kept for backward-compat; all internal callers use this.
export function tokenizeTextFull(text) {
  const raw = normalizeWhitespace(text);

  // Pass 1: split on whitespace to get raw tokens (preserving original case for camelCase detection).
  const rawTokens = raw
    .replace(/[''`]/g, "")
    .split(/[\s,.!?;:()\[\]{}<>"]+/)
    .filter(Boolean);

  const seen = new Set();
  const result = [];

  for (const rawToken of rawTokens) {
    // Split camelCase/PascalCase before lowercasing.
    const parts = splitCamelCase(rawToken)
      // Strip non-identifier chars that survive split (punctuation attached to tokens).
      .map((p) => p.replace(/[^a-z0-9_#+.\-]/g, ""))
      .filter((p) => p.length > 2 && !STOPWORDS.has(p));

    for (const part of parts) {
      if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    }
  }

  return result;
}

export function isCodingRelated(promptText, responseText) {
  const combined = `${promptText} ${responseText}`.toLowerCase();
  if (CODING_CONTEXT_PATTERNS.some((pattern) => pattern.test(`${promptText} ${responseText}`))) {
    return true;
  }
  return includesKeyword(combined, CODING_TERMS);
}

export function classifyTopic(promptText, responseText) {
  const text = `${promptText} ${responseText}`.toLowerCase();
  let bestTopic = "other coding";
  let bestScore = 0;

  Object.entries(TOPIC_RULES).forEach(([topic, keywords]) => {
    const score = countKeywords(text, keywords);
    if (score > bestScore) {
      bestTopic = topic;
      bestScore = score;
    }
  });

  return bestTopic;
}

export function classifyPromptIntent(promptText) {
  const text = promptText.toLowerCase();
  const delegationHits = countKeywords(text, DELEGATION_TERMS);
  const explanationHits = countKeywords(text, EXPLANATION_TERMS);

  // Explanation terms win on ties.
  // Rationale: "explain how to fix X" contains both "explain" (explanation) and "fix"
  // (delegation), but the user's goal is understanding — not receiving a finished patch.
  // Giving delegation the tie-break would over-count implementation requests.
  if (explanationHits > 0 && delegationHits <= explanationHits) {
    return "exploration";
  }
  if (delegationHits > 0) {
    return "delegation";
  }
  return "unknown";
}

// Keep the old export name as a thin alias so existing callers don't break.
// Internal code uses classifyPromptIntent.
export function classifyOffloading(promptText) {
  const intent = classifyPromptIntent(promptText);
  if (intent === "delegation") return "offloading";
  if (intent === "exploration") return "non_offloading";
  return "unknown";
}

export function normalizeInteraction(rawInteraction) {
  const source = safeString(rawInteraction.source).toLowerCase() || "imported";
  const promptText = normalizeWhitespace(rawInteraction.promptText || rawInteraction.prompt || "");
  const responseText = normalizeWhitespace(rawInteraction.responseText || rawInteraction.response || "");
  const timestamp = normalizeDate(rawInteraction.timestamp) ?? new Date().toISOString();
  const codingRelated = isCodingRelated(promptText, responseText);
  const codingTopic = codingRelated ? classifyTopic(promptText, responseText) : "non-coding";
  const offloadingLabel = codingRelated ? classifyOffloading(promptText) : "unknown";

  return {
    id: rawInteraction.id || buildId(source, timestamp, promptText, responseText),
    source,
    timestamp,
    promptText,
    responseText,
    url: safeString(rawInteraction.url),
    isCodingRelated: codingRelated,
    codingTopic,
    offloadingLabel,
    tokenizedPromptWords: tokenizeTextFull(promptText),
    tokenizedResponseWords: tokenizeTextFull(responseText)
  };
}

function roleOf(node) {
  return node?.message?.author?.role || "";
}

function nodeTime(node) {
  const time = node?.message?.create_time;
  return typeof time === "number" ? time : -1;
}

function normalizeTimestampSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value > 10_000_000_000 ? value / 1000 : value);
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000);
  }

  return Math.floor(Date.now() / 1000);
}

function inferSourceLabel(record) {
  const explicitSource = safeString(record?.conversation_origin || record?.source).toLowerCase();
  if (explicitSource) {
    return explicitSource;
  }

  if (Array.isArray(record?.chat_messages)) {
    return "claude";
  }

  const modelLabel = safeString(record?.default_model_slug || record?.model || record?.model_slug).toLowerCase();
  if (modelLabel.includes("claude")) {
    return "claude";
  }
  if (modelLabel.includes("gemini")) {
    return "gemini";
  }
  if (modelLabel.includes("gpt") || modelLabel.includes("openai")) {
    return "chatgpt";
  }

  return "imported";
}

function inferMessageRole(message) {
  const roleHints = [
    safeString(message?.role).toLowerCase(),
    safeString(message?.author?.role).toLowerCase(),
    safeString(message?.sender).toLowerCase(),
    safeString(message?.from).toLowerCase(),
    safeString(message?.type).toLowerCase()
  ];

  if (roleHints.some((hint) => ["assistant", "model", "ai", "claude"].includes(hint))) {
    return "assistant";
  }

  if (roleHints.some((hint) => ["user", "human"].includes(hint))) {
    return "user";
  }

  if (roleHints.some((hint) => hint === "system")) {
    return "system";
  }

  return "";
}

function extractMessageText(message) {
  if (!message || typeof message !== "object") {
    return "";
  }

  const directCandidates = [
    message.text,
    message.content,
    message.message,
    message.prompt,
    message.response,
    message.completion
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string") {
      return normalizeWhitespace(candidate);
    }

    if (Array.isArray(candidate)) {
      const textFromArray = candidate
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item.text === "string") {
            return item.text;
          }
          return "";
        })
        .join("\n")
        .trim();

      if (textFromArray) {
        return normalizeWhitespace(textFromArray);
      }
      continue;
    }

    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const partsText = extractPartsText(candidate);
    if (partsText) {
      return normalizeWhitespace(partsText);
    }
  }

  return "";
}

function convertMessageArrayConversation(rawConversation) {
  const sourceMessages = Array.isArray(rawConversation?.messages)
    ? rawConversation.messages
    : Array.isArray(rawConversation?.chat_messages)
      ? rawConversation.chat_messages
    : Array.isArray(rawConversation?.mapping)
      ? rawConversation.mapping
      : null;

  if (!sourceMessages) {
    return null;
  }

  const normalizedId = safeString(rawConversation.id || rawConversation.uuid || rawConversation.conversation_id)
    || `imported-${crypto.randomUUID()}`;
  const createdAtSeconds = normalizeTimestampSeconds(
    rawConversation.create_time || rawConversation.created_at || rawConversation.createdAt
  );
  const updatedAtSeconds = normalizeTimestampSeconds(
    rawConversation.update_time || rawConversation.updated_at || rawConversation.updatedAt || createdAtSeconds
  );
  const title = normalizeWhitespace(rawConversation.title || rawConversation.name || "Imported conversation")
    || "Imported conversation";
  const rootId = `${normalizedId}:root`;

  const mapping = {
    [rootId]: {
      children: [],
      id: rootId,
      message: {
        author: {
          metadata: {},
          name: null,
          role: "system"
        },
        channel: null,
        content: {
          content_type: "text",
          parts: [""]
        },
        create_time: createdAtSeconds,
        end_turn: true,
        id: rootId,
        metadata: {
          can_save: false,
          is_visually_hidden_from_conversation: true
        },
        recipient: "all",
        status: "finished_successfully",
        update_time: createdAtSeconds,
        weight: 0
      },
      parent: "client-created-root"
    }
  };

  let parentId = rootId;
  let nodeCount = 0;

  sourceMessages.forEach((message, index) => {
    const role = inferMessageRole(message);
    const text = extractMessageText(message);

    if (!role || !text) {
      return;
    }

    const nodeId = safeString(message?.id || message?.uuid) || `${normalizedId}:m:${index}`;
    const nodeTimeSeconds = normalizeTimestampSeconds(
      message?.create_time || message?.created_at || message?.timestamp || createdAtSeconds
    );

    mapping[nodeId] = {
      children: [],
      id: nodeId,
      message: {
        author: {
          metadata: {},
          name: null,
          role
        },
        channel: role === "assistant" ? "final" : null,
        content: {
          content_type: "text",
          parts: [text]
        },
        create_time: nodeTimeSeconds,
        end_turn: role === "assistant",
        id: nodeId,
        metadata: {
          can_save: role === "assistant"
        },
        recipient: "all",
        status: "finished_successfully",
        update_time: nodeTimeSeconds,
        weight: 1
      },
      parent: parentId
    };

    mapping[parentId].children.push(nodeId);
    parentId = nodeId;
    nodeCount += 1;
  });

  if (!nodeCount) {
    return null;
  }

  const source = inferSourceLabel(rawConversation);
  const modelSlugBySource = {
    chatgpt: "gpt-import",
    claude: "claude-import",
    gemini: "gemini-import"
  };

  return {
    ...rawConversation,
    id: normalizedId,
    conversation_id: normalizedId,
    title,
    create_time: createdAtSeconds,
    update_time: updatedAtSeconds,
    conversation_origin: source,
    current_node: parentId,
    default_model_slug: modelSlugBySource[source] || `${source || "imported"}-import`,
    mapping
  };
}

function normalizeConversationRecord(rawConversation) {
  if (!rawConversation || typeof rawConversation !== "object") {
    return null;
  }

  if (isConversationExport(rawConversation)) {
    return rawConversation;
  }

  const normalizedId = safeString(rawConversation.id || rawConversation.uuid || rawConversation.conversation_id);
  const mappingObject = rawConversation.mapping && typeof rawConversation.mapping === "object" && !Array.isArray(rawConversation.mapping)
    ? rawConversation.mapping
    : null;

  if (normalizedId && mappingObject) {
    return {
      ...rawConversation,
      id: normalizedId,
      title: normalizeWhitespace(rawConversation.title || rawConversation.name || "Imported conversation") || "Imported conversation",
      create_time: rawConversation.create_time || normalizeTimestampSeconds(rawConversation.created_at || rawConversation.createdAt),
      update_time: rawConversation.update_time || normalizeTimestampSeconds(rawConversation.updated_at || rawConversation.updatedAt),
      conversation_origin: safeString(rawConversation.conversation_origin || rawConversation.source).toLowerCase() || inferSourceLabel(rawConversation)
    };
  }

  return convertMessageArrayConversation(rawConversation);
}

function extractConversationRecords(rawConversations) {
  if (Array.isArray(rawConversations)) {
    return rawConversations;
  }

  if (Array.isArray(rawConversations?.conversations)) {
    return rawConversations.conversations;
  }

  if (Array.isArray(rawConversations?.chats)) {
    return rawConversations.chats;
  }

  if (Array.isArray(rawConversations?.data)) {
    return rawConversations.data;
  }

  return [];
}

function extractSource(conversation) {
  const origin = safeString(conversation.conversation_origin).toLowerCase();
  if (origin) {
    return origin;
  }

  const modelSlug = safeString(conversation.default_model_slug).toLowerCase();
  if (modelSlug.includes("claude")) {
    return "claude";
  }
  if (modelSlug.includes("gemini")) {
    return "gemini";
  }
  if (modelSlug.includes("gpt") || modelSlug.includes("openai")) {
    return "chatgpt";
  }
  return "imported";
}

function assistantDescendants(mapping, node) {
  const queue = Array.isArray(node?.children) ? [...node.children] : [];
  const matches = [];

  while (queue.length) {
    const childId = queue.shift();
    const childNode = mapping?.[childId];
    if (!childNode) {
      continue;
    }

    const role = roleOf(childNode);
    if (role === "assistant") {
      matches.push(childNode);
      continue;
    }

    if (role !== "user" && Array.isArray(childNode.children)) {
      queue.push(...childNode.children);
    }
  }

  return matches.sort((left, right) => nodeTime(left) - nodeTime(right));
}

export function isConversationExport(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.mapping === "object" &&
    !Array.isArray(value.mapping) &&
    value.mapping !== null &&
    typeof value.id === "string"
  );
}

export function normalizeConversations(rawConversations) {
  return extractConversationRecords(rawConversations)
    .map(normalizeConversationRecord)
    .filter(isConversationExport);
}

export function extractInteractionsFromConversation(conversation) {
  if (!isConversationExport(conversation)) {
    return [];
  }

  const mapping = conversation.mapping || {};
  const source = extractSource(conversation);

  return Object.values(mapping)
    .filter((node) => roleOf(node) === "user")
    .sort((left, right) => nodeTime(left) - nodeTime(right))
    .flatMap((userNode) => {
      const assistants = assistantDescendants(mapping, userNode);
      if (!assistants.length) {
        return [];
      }

      return assistants.map((assistantNode, index) =>
        normalizeInteraction({
          id: `${conversation.id}:${userNode.id}:${assistantNode.id}:${index}`,
          source,
          timestamp: assistantNode.message?.create_time || userNode.message?.create_time || conversation.update_time || conversation.create_time,
          promptText: extractPartsText(userNode.message?.content),
          responseText: extractPartsText(assistantNode.message?.content),
          url: ""
        })
      );
    });
}

export function createConversationRecord({
  source,
  promptText,
  responseText,
  timestamp,
  url
}) {
  const createTimeSeconds = typeof timestamp === "number"
    ? timestamp
    : Math.floor(new Date(timestamp || Date.now()).getTime() / 1000);
  const conversationId = crypto.randomUUID();
  const systemId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const assistantId = crypto.randomUUID();
  const cleanedPrompt = normalizeWhitespace(promptText);
  const cleanedResponse = normalizeWhitespace(responseText);
  const modelSlugBySource = {
    chatgpt: "gpt-live-capture",
    claude: "claude-live-capture",
    gemini: "gemini-live-capture"
  };

  return {
    async_status: null,
    atlas_mode_enabled: null,
    blocked_urls: [],
    context_scopes: null,
    conversation_id: conversationId,
    conversation_origin: source,
    conversation_template_id: null,
    create_time: createTimeSeconds,
    current_node: assistantId,
    default_model_slug: modelSlugBySource[source] || `${source || "captured"}-live-capture`,
    disabled_tool_ids: [],
    gizmo_id: null,
    gizmo_type: null,
    id: conversationId,
    is_archived: false,
    is_do_not_remember: false,
    is_read_only: null,
    is_starred: null,
    is_study_mode: false,
    mapping: {
      [systemId]: {
        children: [userId],
        id: systemId,
        message: {
          author: {
            metadata: {},
            name: null,
            role: "system"
          },
          channel: null,
          content: {
            content_type: "text",
            parts: [""]
          },
          create_time: null,
          end_turn: true,
          id: systemId,
          metadata: {
            can_save: false,
            is_visually_hidden_from_conversation: true
          },
          recipient: "all",
          status: "finished_successfully",
          update_time: null,
          weight: 0
        },
        parent: "client-created-root"
      },
      [userId]: {
        children: [assistantId],
        id: userId,
        message: {
          author: {
            metadata: {},
            name: null,
            role: "user"
          },
          channel: null,
          content: {
            content_type: "text",
            parts: [cleanedPrompt]
          },
          create_time: createTimeSeconds,
          end_turn: null,
          id: userId,
          metadata: {
            can_save: false
          },
          recipient: "all",
          status: "finished_successfully",
          update_time: null,
          weight: 1
        },
        parent: systemId
      },
      [assistantId]: {
        children: [],
        id: assistantId,
        message: {
          author: {
            metadata: {},
            name: null,
            role: "assistant"
          },
          channel: "final",
          content: {
            content_type: "text",
            parts: [cleanedResponse]
          },
          create_time: createTimeSeconds,
          end_turn: true,
          id: assistantId,
          metadata: {
            can_save: true,
            citations: [],
            content_references: [],
            model_slug: modelSlugBySource[source] || source || "captured-live"
          },
          recipient: "all",
          status: "finished_successfully",
          update_time: createTimeSeconds,
          weight: 1
        },
        parent: userId
      }
    },
    memory_scope: null,
    moderation_results: [],
    owner: null,
    pinned_time: null,
    plugin_ids: null,
    safe_urls: url ? [url] : [],
    sugar_item_id: null,
    sugar_item_visible: false,
    title: cleanedPrompt.slice(0, 80) || "Captured conversation",
    update_time: createTimeSeconds,
    voice: null
  };
}

function incrementCounter(bucket, key, amount = 1) {
  bucket[key] = (bucket[key] || 0) + amount;
}

function toSortedEntries(counter) {
  return Object.entries(counter).sort((a, b) => b[1] - a[1]);
}

function toChronologicalEntries(counter) {
  return Object.entries(counter).sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Returns the top `limit` words from the given field across all interactions,
 * each enriched with a quality `score` and a CSS `color` for word-cloud rendering.
 *
 * Shape of each entry:
 *   { word: string, count: number, score: number, color: string }
 */
function topWords(interactions, field, limit = 30) {
  const counts = {};
  interactions.forEach((interaction) => {
    const words = Array.isArray(interaction[field]) ? interaction[field] : [];
    words.forEach((word) => incrementCounter(counts, word));
  });

  return toSortedEntries(counts)
    .slice(0, limit)
    .map(([word, count]) => ({
      word,
      count,
      score: getWordScore(word),
      color: getWordColor(word)
    }));
}

function strongestTimeBucket(hourlyCounts) {
  const buckets = [
    { label: "Late night", hours: [0, 1, 2, 3, 4] },
    { label: "Morning", hours: [5, 6, 7, 8, 9, 10, 11] },
    { label: "Afternoon", hours: [12, 13, 14, 15, 16] },
    { label: "Evening", hours: [17, 18, 19, 20, 21, 22, 23] }
  ];

  return buckets
    .map((bucket) => ({
      label: bucket.label,
      total: bucket.hours.reduce((sum, hour) => sum + (hourlyCounts[hour] || 0), 0)
    }))
    .sort((a, b) => b.total - a.total)[0];
}

function getWeekdayLabel(date) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[date.getDay()];
}

function computeScoreMetrics(interactions) {
  if (!interactions.length) {
    return {
      score: 0,
      delegationRatio: 0,
      outputTypeRatio: 0,
      explanationRatio: 0,
      delegationCount: 0,
      explanationCount: 0,
      outputTypeCount: 0
    };
  }

  let delegationCount = 0;
  let explanationCount = 0;
  let outputTypeCount = 0;
  let conceptualCount = 0;

  for (const interaction of interactions) {
    const prompt = interaction.promptText.toLowerCase();
    if (interaction.offloadingLabel === "offloading") delegationCount++;
    if (includesKeyword(prompt, EXPLANATION_TERMS))   explanationCount++;
    if (includesKeyword(prompt, OUTPUT_TYPE_TERMS))   outputTypeCount++;
    if (includesKeyword(prompt, CONCEPTUAL_TERMS))    conceptualCount++;
  }

  const total = interactions.length;
  const delegationRatio   = delegationCount  / total;
  const outputTypeRatio   = outputTypeCount  / total;
  const explanationRatio  = explanationCount / total;
  const conceptualRatio   = conceptualCount  / total;

  // Single-pass ratio score — all inputs are in [0, 1], output clamps to [0, 100].
  // Delegation and concrete output requests push the score up;
  // explanation-only and conceptual queries pull it down.
  const raw = (delegationRatio  * 60)
            + (outputTypeRatio  * 25)
            - (explanationRatio * 10)
            - (conceptualRatio  * 15);

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return {
    score,
    delegationRatio,
    outputTypeRatio,
    explanationRatio,
    delegationCount,
    explanationCount,
    outputTypeCount
  };
}

function buildReflection({ codingInteractions, topTopic, strongestPattern, scoreMetrics }) {
  if (!codingInteractions.length) {
    return "Import a conversation export or capture a few sessions to see your usage summary here.";
  }

  const timeLabel  = strongestPattern.label.toLowerCase();
  const topicLabel = topTopic?.[0] ?? "general coding";

  const behaviorPhrase =
    scoreMetrics.score >= 65
      ? "Most prompts ask the model to write or build something directly."
      : scoreMetrics.score >= 35
      ? "You split time fairly evenly between asking for explanations and requesting implementations."
      : "Most prompts lean toward explanations and concept questions rather than direct implementation requests.";

  return `Most of your coding sessions happen in the ${timeLabel}, with ${topicLabel} as the dominant topic. ${behaviorPhrase}`;
}

function buildRecommendation({ scoreMetrics, topTopic, topicCounts }) {
  if (!topicCounts.length) {
    return "Import a dataset or capture a few sessions to generate a personalised recommendation.";
  }

  const topTopicLabel   = topTopic?.[0] ?? "";
  const debuggingCount  = topicCounts.find(([t]) => t === "debugging")?.[1]      ?? 0;
  const generationCount = topicCounts.find(([t]) => t === "code generation")?.[1] ?? 0;

  if (scoreMetrics.score < 35 && topTopicLabel === "explanation") {
    return "Try converting one explanation prompt per session into a direct request — ask for a working patch, a test, or a refactored version rather than an explanation of how to approach it.";
  }

  if (generationCount > debuggingCount + 2) {
    return "You generate a lot of code but debug relatively little through the model. Try pasting error messages directly and asking for a ranked list of likely root causes.";
  }

  if (scoreMetrics.score >= 65) {
    return "Your implementation score is high. Consider occasionally asking the model to explain its own output — understanding generated code makes it easier to catch subtle issues before review.";
  }

  return "Ask for concrete outputs more often — a test suite, a migration query, or a file-level refactor — rather than open-ended explanations. Specific requests produce more directly usable results.";
}

function normalizeDateInputBoundary(value, boundary) {
  if (!value) {
    return null;
  }

  const suffix = boundary === "end" ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const date = new Date(`${value}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterInteractionsByDateRange(interactions, startDate, endDate) {
  if (!startDate && !endDate) {
    return interactions;
  }

  return interactions.filter((interaction) => {
    const timestamp = new Date(interaction.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      return false;
    }
    if (startDate && timestamp < startDate) {
      return false;
    }
    if (endDate && timestamp > endDate) {
      return false;
    }
    return true;
  });
}

function buildPromptQualitySeries(interactions, axisMode) {
  const labels = axisMode === "weekday"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
  const buckets = labels.map((label) => ({
    label,
    good: 0,
    bad: 0,
    unknown: 0
  }));

  interactions.forEach((interaction) => {
    const date = new Date(interaction.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const bucketIndex = axisMode === "weekday"
      ? ((date.getDay() + 6) % 7)
      : date.getHours();

    if (interaction.offloadingLabel === "non_offloading") {
      buckets[bucketIndex].good += 1;
    } else if (interaction.offloadingLabel === "offloading") {
      buckets[bucketIndex].bad += 1;
    } else {
      buckets[bucketIndex].unknown += 1;
    }
  });

  return {
    labels,
    goodCounts: buckets.map((bucket) => bucket.good),
    badCounts: buckets.map((bucket) => bucket.bad),
    unknownCounts: buckets.map((bucket) => bucket.unknown),
    goodRatios: buckets.map((bucket) => {
      const total = bucket.good + bucket.bad + bucket.unknown;
      return total ? bucket.good / total : 0;
    }),
    badRatios: buckets.map((bucket) => {
      const total = bucket.good + bucket.bad + bucket.unknown;
      return total ? bucket.bad / total : 0;
    }),
    unknownRatios: buckets.map((bucket) => {
      const total = bucket.good + bucket.bad + bucket.unknown;
      return total ? bucket.unknown / total : 0;
    })
  };
}

function buildFilteredHourlyCounts(interactions, filters = {}) {
  const includeGood    = filters.includeGood    !== false;
  const includeBad     = filters.includeBad     !== false;
  const includeUnknown = filters.includeUnknown !== false;
  const counts = {};

  interactions.forEach((interaction) => {
    const label = interaction.offloadingLabel;
    const includeInteraction =
      (includeGood    && label === "non_offloading") ||
      (includeBad     && label === "offloading")     ||
      (includeUnknown && label === "unknown");

    if (!includeInteraction) {
      return;
    }

    const date = new Date(interaction.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    incrementCounter(counts, date.getHours());
  });

  return Array.from({ length: 24 }, (_, hour) => [String(hour), counts[hour] || 0]);
}

export function analyzeConversations(conversations) {
  const normalizedInteractions = normalizeConversations(conversations).flatMap(extractInteractionsFromConversation);
  const codingInteractions = normalizedInteractions.filter((interaction) => interaction.isCodingRelated);
  const visibleInteractions = codingInteractions;

  const dailyCounts   = {};
  const hourlyCounts  = {};
  const weekdayCounts = {};
  const topicCounts   = {};
  const sourceCounts  = {};

  visibleInteractions.forEach((interaction) => {
    const date    = new Date(interaction.timestamp);
    const dayKey  = interaction.timestamp.slice(0, 10);
    const hour    = date.getHours();
    const weekday = getWeekdayLabel(date);

    incrementCounter(dailyCounts,   dayKey);
    incrementCounter(hourlyCounts,  hour);
    incrementCounter(weekdayCounts, weekday);
    incrementCounter(sourceCounts,  interaction.source);

    if (interaction.isCodingRelated) {
      incrementCounter(topicCounts, interaction.codingTopic);
    }
  });

  const sortedTopicCounts = toSortedEntries(topicCounts);
  const scoreMetrics      = computeScoreMetrics(codingInteractions);
  const strongestPattern  = strongestTimeBucket(hourlyCounts);
  const reflection        = buildReflection({
    codingInteractions,
    topTopic: sortedTopicCounts[0],
    strongestPattern,
    scoreMetrics
  });
  const recommendation = buildRecommendation({
    scoreMetrics,
    topTopic: sortedTopicCounts[0],
    topicCounts: sortedTopicCounts
  });

  return {
    allInteractions: normalizedInteractions,
    visibleInteractions,
    codingInteractions,
    totalInteractions: normalizedInteractions.length,
    totalCodingInteractions: codingInteractions.length,
    dailyCounts: toChronologicalEntries(dailyCounts),
    hourlyCounts: Array.from({ length: 24 }, (_, hour) => [String(hour), hourlyCounts[hour] || 0]),
    weekdayCounts: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => [day, weekdayCounts[day] || 0]),
    topicCounts: sortedTopicCounts,
    sourceCounts: toSortedEntries(sourceCounts),
    promptWords: topWords(codingInteractions, "tokenizedPromptWords"),
    responseWords: topWords(codingInteractions, "tokenizedResponseWords"),
    scoreMetrics,
    strongestPattern,
    reflection,
    recommendation
  };
}

export function buildTimePatternDetail(conversations, options = {}) {
  const normalizedInteractions = normalizeConversations(conversations).flatMap(extractInteractionsFromConversation);
  const codingInteractions = normalizedInteractions.filter((interaction) => interaction.isCodingRelated);
  const startDate = normalizeDateInputBoundary(options.startDate, "start");
  const endDate   = normalizeDateInputBoundary(options.endDate,   "end");
  const filtered  = filterInteractionsByDateRange(codingInteractions, startDate, endDate);
  const axisMode  = options.axisMode === "weekday" ? "weekday" : "hour";
  const series    = buildPromptQualitySeries(filtered, axisMode);

  const chronologicalInteractions = [...codingInteractions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    minDate: chronologicalInteractions.length ? chronologicalInteractions[0].timestamp.slice(0, 10) : "",
    maxDate: chronologicalInteractions.length ? chronologicalInteractions[chronologicalInteractions.length - 1].timestamp.slice(0, 10) : "",
    qualitySeries: {
      labels: series.labels,
      goodValues: series.goodRatios,
      badValues: series.badRatios,
      unknownValues: series.unknownRatios
    },
    qualityCountSeries: {
      labels: series.labels,
      goodValues: series.goodCounts,
      badValues: series.badCounts,
      unknownValues: series.unknownCounts
    },
    filteredHourlyCounts: buildFilteredHourlyCounts(filtered, {
      includeGood:    options.includeGood,
      includeBad:     options.includeBad,
      includeUnknown: options.includeUnknown
    })
  };
}
