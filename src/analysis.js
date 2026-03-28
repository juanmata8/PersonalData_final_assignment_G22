const CODING_TERMS = [
  "bug", "debug", "error", "stack trace", "exception", "function", "class", "method", "variable",
  "typescript", "javascript", "python", "java", "csharp", "react", "node", "sql", "api", "json",
  "css", "html", "test", "refactor", "compile", "build", "deploy", "docker", "git", "query",
  "schema", "typescript", "regex", "frontend", "backend", "package", "module", "component",
  "algorithm", "endpoint", "repository", "branch", "lint", "npm", "yarn", "pnpm", "vite", "webpack"
];

const CODING_CONTEXT_PATTERNS = [
  /```/,
  /\b[a-z0-9_-]+\.(js|ts|tsx|jsx|py|java|rb|go|rs|sql|css|html|json|md)\b/i,
  /\b(line|column) \d+\b/i,
  /\b(http|runtime|syntax|type|reference) error\b/i,
  /\bunit test|integration test|test case\b/i
];

const OFFLOADING_TERMS = [
  "fix", "make", "write", "implement", "refactor", "generate", "create",
  "do", "update", "optimize", "add", "build", "draft", "produce", "rewrite"
];

const EXPLANATION_TERMS = [
  "explain", "why", "how does", "what is", "teach", "describe", "clarify", "walk through"
];

const ARTIFACT_TERMS = [
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

const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "your", "into", "about", "there",
  "would", "could", "should", "what", "when", "where", "which", "while", "please", "thanks", "need",
  "help", "using", "used", "user", "users", "assistant", "response", "prompt", "chatgpt", "claude",
  "gemini", "just", "than", "them", "then", "their", "will", "were", "been", "being", "also", "here",
  "code", "coding", "project", "want", "make", "into", "they", "them", "very", "some", "more", "most",
  "have", "does", "like", "from", "each", "after", "before", "because", "through", "about", "over",
  "under", "able", "count", "counts", "generated", "locally", "browser", "extension", "data"
]);

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
  return new Date().toISOString();
}

export function tokenizeText(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9_#+.\-\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
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

export function classifyOffloading(promptText) {
  const text = promptText.toLowerCase();
  const offloadingHits = countKeywords(text, OFFLOADING_TERMS);
  const explanationHits = countKeywords(text, EXPLANATION_TERMS);

  if (offloadingHits > explanationHits) {
    return "offloading";
  }
  if (explanationHits > offloadingHits) {
    return "non_offloading";
  }
  return "unknown";
}

export function normalizeInteraction(rawInteraction) {
  const source = safeString(rawInteraction.source).toLowerCase() || "imported";
  const promptText = normalizeWhitespace(rawInteraction.promptText || rawInteraction.prompt || "");
  const responseText = normalizeWhitespace(rawInteraction.responseText || rawInteraction.response || "");
  const timestamp = normalizeDate(rawInteraction.timestamp);
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
    tokenizedPromptWords: tokenizeText(promptText),
    tokenizedResponseWords: tokenizeText(responseText)
  };
}

function roleOf(node) {
  return node?.message?.author?.role || "";
}

function nodeTime(node) {
  const time = node?.message?.create_time;
  return typeof time === "number" ? time : -1;
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
    value.mapping !== null &&
    typeof value.id === "string"
  );
}

export function normalizeConversations(rawConversations) {
  return Array.isArray(rawConversations) ? rawConversations.filter(isConversationExport) : [];
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

function topWords(interactions, field, limit = 30) {
  const counts = {};
  interactions.forEach((interaction) => {
    const words = Array.isArray(interaction[field]) ? interaction[field] : [];
    words.forEach((word) => incrementCounter(counts, word));
  });

  return toSortedEntries(counts)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
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
      offloadingRatio: 0,
      artifactRatio: 0,
      explanationRatio: 0,
      offloadingCount: 0,
      explanationCount: 0,
      artifactCount: 0
    };
  }

  let offloadingCount = 0;
  let explanationCount = 0;
  let artifactCount = 0;

  interactions.forEach((interaction) => {
    const prompt = interaction.promptText.toLowerCase();

    if (interaction.offloadingLabel === "offloading") {
      offloadingCount += 1;
    }

    if (includesKeyword(prompt, EXPLANATION_TERMS)) {
      explanationCount += 1;
    }

    if (includesKeyword(prompt, ARTIFACT_TERMS)) {
      artifactCount += 1;
    }
  });

  const total = interactions.length;
  const offloadingRatio = offloadingCount / total;
  const artifactRatio = artifactCount / total;
  const explanationRatio = explanationCount / total;

  let score = offloadingRatio * 70 + artifactRatio * 20 - explanationRatio * 10;

  interactions.forEach((interaction) => {
    const prompt = interaction.promptText.toLowerCase();
    if (includesKeyword(prompt, CONCEPTUAL_TERMS)) {
      score -= 2;
    }
    if (includesKeyword(prompt, ARTIFACT_TERMS)) {
      score += 1;
    }
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    offloadingRatio,
    artifactRatio,
    explanationRatio,
    offloadingCount,
    explanationCount,
    artifactCount
  };
}

function buildReflection({ codingInteractions, topTopic, strongestPattern, scoreMetrics }) {
  if (!codingInteractions.length) {
    return "No coding-related interactions are available yet, so the extension cannot infer a usage pattern or offloading tendency.";
  }

  const level =
    scoreMetrics.score >= 65 ? "high" :
    scoreMetrics.score >= 35 ? "moderate" :
    "low";

  return `Your coding usage is concentrated in the ${strongestPattern.label.toLowerCase()}, with ${topTopic?.[0] || "other coding"} as the most common topic. The cognitive offloading pattern is ${level}, based on how often your prompts ask the model to carry out implementation work rather than explain concepts.`;
}

function buildRecommendation({ scoreMetrics, topTopic, strongestPattern, topicCounts }) {
  if (!topicCounts.length) {
    return "Import a dataset or capture a few coding sessions so the extension can generate a recommendation.";
  }

  const topTopicLabel = topTopic?.[0] || "";
  const debuggingCount = topicCounts.find(([topic]) => topic === "debugging")?.[1] || 0;
  const generationCount = topicCounts.find(([topic]) => topic === "code generation")?.[1] || 0;

  if (scoreMetrics.score < 35 && topTopicLabel === "explanation") {
    return "Try converting one explanation-style prompt each session into a direct implementation request, such as asking for a patch, test, or refactor draft.";
  }

  if (generationCount > debuggingCount + 2) {
    return "Use the model for targeted debugging more often by pasting exact error messages and asking for a ranked root-cause analysis.";
  }

  if (strongestPattern.label === "Late night") {
    return "Your heaviest usage happens late at night. Consider moving complex implementation prompts earlier so you can review generated code with more context.";
  }

  return "Increase cognitive offloading by asking for concrete artifacts such as tests, migration queries, or file-level refactors instead of purely conceptual explanations.";
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

    if (interaction.offloadingLabel === "offloading") {
      buckets[bucketIndex].good += 1;
    } else if (interaction.offloadingLabel === "non_offloading") {
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
  const includeGood = filters.includeGood !== false;
  const includeBad = filters.includeBad !== false;
  const includeUnknown = filters.includeUnknown !== false;
  const counts = {};

  interactions.forEach((interaction) => {
    const label = interaction.offloadingLabel;
    const includeInteraction =
      (includeGood && label === "offloading") ||
      (includeBad && label === "non_offloading") ||
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

  const dailyCounts = {};
  const hourlyCounts = {};
  const weekdayCounts = {};
  const topicCounts = {};
  const sourceCounts = {};

  visibleInteractions.forEach((interaction) => {
    const date = new Date(interaction.timestamp);
    const dayKey = interaction.timestamp.slice(0, 10);
    const hour = date.getHours();
    const weekday = getWeekdayLabel(date);

    incrementCounter(dailyCounts, dayKey);
    incrementCounter(hourlyCounts, hour);
    incrementCounter(weekdayCounts, weekday);
    incrementCounter(sourceCounts, interaction.source);

    if (interaction.isCodingRelated) {
      incrementCounter(topicCounts, interaction.codingTopic);
    }
  });

  const sortedTopicCounts = toSortedEntries(topicCounts);
  const scoreMetrics = computeScoreMetrics(codingInteractions);
  const strongestPattern = strongestTimeBucket(hourlyCounts);
  const reflection = buildReflection({
    codingInteractions,
    topTopic: sortedTopicCounts[0],
    strongestPattern,
    scoreMetrics
  });
  const recommendation = buildRecommendation({
    scoreMetrics,
    topTopic: sortedTopicCounts[0],
    strongestPattern,
    topicCounts: sortedTopicCounts
  });

  return {
    allInteractions: normalizedInteractions,
    visibleInteractions,
    codingInteractions,
    totalInteractions: normalizedInteractions.length,
    totalCodingInteractions: codingInteractions.length,
    dailyCounts: toSortedEntries(dailyCounts),
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
  const endDate = normalizeDateInputBoundary(options.endDate, "end");
  const filtered = filterInteractionsByDateRange(codingInteractions, startDate, endDate);
  const axisMode = options.axisMode === "weekday" ? "weekday" : "hour";
  const series = buildPromptQualitySeries(filtered, axisMode);

  return {
    minDate: codingInteractions.length ? codingInteractions[0].timestamp.slice(0, 10) : "",
    maxDate: codingInteractions.length ? codingInteractions[codingInteractions.length - 1].timestamp.slice(0, 10) : "",
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
      includeGood: options.includeGood,
      includeBad: options.includeBad,
      includeUnknown: options.includeUnknown
    })
  };
}
