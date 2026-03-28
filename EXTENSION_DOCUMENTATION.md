# LLM Coding Explorer Documentation

## Overview

LLM Coding Explorer is a Chrome Manifest V3 browser extension that helps users inspect how they use large language models while coding. It works entirely locally inside the browser and supports two ingestion paths:

- JSON conversation import through the setup page
- live capture from ChatGPT, Claude, and Gemini through content scripts

All imported and captured records are stored in a ChatGPT-style conversation export format, then normalized into interaction pairs for analysis.

The extension renders its visualizations with a local vendored D3.js bundle included in the extension package, rather than loading chart code from a CDN.

## Data Flow

### 1. JSON conversation import

The setup page accepts a `conversations.json` style file and parses it locally in the browser. The file must be a top-level array of conversation objects with a `mapping` tree of messages.

Only records matching that structure are imported.

### 2. Live capture

For ChatGPT, Claude, and Gemini, the extension injects a content script that:

- watches for common prompt submit actions such as form submit, send-button click, or Enter in the composer
- reads the current prompt text
- polls the page for the latest visible assistant response
- sends the prompt-response pair to the background service worker

The background service worker checks whether capture is enabled for that source and, if so, stores the exchange as a new conversation object in the same export-style format.

### 3. Normalization

Stored conversations are converted into interaction pairs by walking user-to-assistant paths in each conversation mapping. Each derived interaction is normalized into this shape:

- `id`
- `source`
- `timestamp`
- `promptText`
- `responseText`
- `url`
- `isCodingRelated`
- `codingTopic`
- `offloadingLabel`
- `tokenizedPromptWords`
- `tokenizedResponseWords`

This allows imported JSON exports and live-captured conversations to be analyzed the same way.

## Coding-Related Detection

An interaction counts as coding-related when the prompt or response contains coding signals such as:

- code fences like triple backticks
- file extensions such as `.js`, `.ts`, `.py`, `.sql`, `.css`, `.html`
- error terminology like `syntax error`, `runtime error`, `stack trace`, `exception`
- programming words such as `function`, `class`, `variable`, `API`, `query`, `component`
- framework or tooling names such as `React`, `Node`, `Docker`, `Git`, `npm`, `Vite`, `Webpack`

If none of those heuristics are present, the interaction is stored but excluded from coding-specific visualizations and the cognitive offloading score.

## Topic Classification

Coding interactions are classified into a fixed taxonomy using weighted keyword matching:

- debugging
- code generation
- refactoring
- explanation
- testing
- tooling/environment
- architecture/design
- data/querying
- other coding

Examples:

- prompts mentioning `bug`, `error`, or `stack trace` are likely to be labeled `debugging`
- prompts with `generate`, `implement`, or `build` are likely to be labeled `code generation`
- prompts with `refactor`, `rename`, or `simplify` are likely to be labeled `refactoring`
- prompts with `explain`, `why`, or `clarify` are likely to be labeled `explanation`

If no topic wins, the interaction falls back to `other coding`.

## Word Frequency and Word Clouds

The extension tokenizes prompt and response text separately. It lowercases words, strips punctuation, and removes common stopwords and extension-specific filler words.

The remaining tokens are counted to produce:

- prompt word cloud
- response word cloud
- top prompt words table
- top response words table

These views help answer which words appear most often in prompts and LLM responses.

## Time-Based Visualizations

The time patterns page derives local charts from normalized timestamps:

- daily interaction count
- hour-of-day heatmap
- day-of-week bar chart
- good/bad/unknown ratio line chart by hour of day or day of week
- good/bad/unknown grouped count chart by hour of day or day of week

The extension only visualizes coding-related interactions. Non-coding conversations may still exist in stored exports, but they are excluded from the analytical views and score.

For the prompt-quality charts:

- `good` means explanation-oriented coding prompts that support learning
- `bad` means offloading-oriented coding prompts where the model is asked to carry out the work
- `unknown` means coding-related prompts without a clear offloading classification
- the ratio line chart shows the share of `good`, `bad`, and `unknown` prompts in each time bucket
- the grouped count chart shows raw counts for `good`, `bad`, and `unknown`

Both prompt-quality charts support:

- a selectable date interval
- x-axis switching between hour of day and day of week

## Cognitive Offloading

### What counts as cognitive offloading in v1

In this extension, cognitive offloading means using the LLM to carry out or draft work for you rather than mainly asking for explanations.

Prompts are considered offloading-oriented when they are dominated by directive or task-execution terms such as:

- `fix`
- `make`
- `write`
- `implement`
- `refactor`
- `generate`
- `create`
- `do`
- `update`
- `optimize`
- `add`
- `build`

Prompts are considered non-offloading when they are dominated by explanation-oriented language such as:

- `explain`
- `why`
- `how does`
- `what is`
- `teach`
- `describe`
- `clarify`

If neither side clearly dominates, the prompt is labeled `unknown`.

### Offloading score formula

The extension computes a 0-100 score using coding-related prompts only.

Base formula:

- `70%` from the ratio of offloading-oriented prompts
- `20%` from the ratio of prompts requesting concrete artifacts such as functions, tests, files, queries, patches, scripts, or endpoints
- `10%` penalty from the ratio of explanation-heavy prompts

Then the score is slightly adjusted:

- small positive adjustment for artifact-request language
- small negative adjustment for conceptual terms such as `concept`, `definition`, `overview`, or `compare`

Finally the score is clamped to the `0-100` range.

Interpretation:

- low score: the user mostly asks for explanations or conceptual help
- mid score: the user mixes explanation and execution support
- high score: the user often asks the LLM to draft, fix, or implement concrete coding work

## Reflection and Recommendation

The summary page does not generate free-form AI text. Instead it uses deterministic templates built from:

- top coding topic
- strongest time-of-day pattern
- offloading score band
- specific imbalances such as explanation-heavy behavior or code-generation-heavy behavior

It then selects one practical recommendation, such as asking for more direct patches, tests, or error analysis.

## Privacy and Storage

- All data is stored in `chrome.storage.local`.
- No backend is used.
- No external API calls are made.
- The extension analyzes imported and live-captured data entirely inside the browser.

## How to Test

### 1. Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project folder.
5. Pin the extension so the popup is easy to access.

### 2. Verify the setup page opens

1. Click the extension icon.
2. Open **Setup**.
3. Confirm the page shows:
   - JSON upload
   - conversation preview
   - source toggles for ChatGPT, Claude, and Gemini
   - local dataset summary cards

### 3. Test JSON import

Use the provided `data/conversations.json` file or another export with the same structure.

Then test:

1. Upload the JSON file in **Setup**.
2. Confirm the preview table shows conversation metadata.
3. Click **Import conversation file**.
5. Confirm the setup metrics update.

### 4. Test live capture

For each supported source:

- ChatGPT
- Claude
- Gemini

run this flow:

1. Make sure the source toggle is enabled in **Setup**.
2. Open the relevant site in Chrome.
3. Send a coding-related prompt such as `Fix this TypeScript error in my React component`.
4. Wait for the assistant response to finish rendering.
5. Open the extension and confirm the interaction count increased.

Then disable one source in **Setup** and repeat. The count should no longer increase for that source.

### 5. Test coding-related filtering

Use prompts like:

- `Fix this failing Jest test`
- `Refactor this function into smaller helpers`
- `Explain what polymorphism means`
- `What is the weather today?`

Expected behavior:

- the first three should usually be marked as coding-related
- the weather prompt should remain stored but excluded from coding visualizations and the offloading score

### 6. Test topic classification

Use representative prompts and check the **Categories** page:

- `Fix this stack trace in my Node API` -> debugging
- `Write a React component for a login form` -> code generation
- `Refactor this function to remove duplication` -> refactoring
- `Explain how async await works in JavaScript` -> explanation
- `Write unit tests for this utility` -> testing
- `Help me fix my Vite config` -> tooling/environment
- `Compare repository pattern vs direct SQL access` -> architecture/design or data/querying depending on wording

The exact category depends on the keyword rules, but it should be directionally correct.

### 7. Test time-pattern visualizations

Import a conversation export with records on different days and times.

Verify:

- **Time Patterns** shows daily counts
- the weekday chart changes when rows are distributed across weekdays
- the hourly heatmap reflects the imported timestamps

### 8. Test word frequency views

Use repeated terms in prompts and responses, for example:

- prompt terms: `fix`, `react`, `test`
- response terms: `state`, `component`, `assertion`

Then confirm:

- those terms appear prominently in the word clouds
- the top-word tables show them with higher counts
- obvious filler words are filtered out

### 9. Test the cognitive offloading score

Import or capture two contrasting datasets.

Low-offloading example:

- `Explain what dependency injection is`
- `Why does this pattern work`
- `Describe how React reconciliation works`

Higher-offloading example:

- `Fix this failing test`
- `Write a migration for this table`
- `Generate a patch for this CSS layout bug`

Expected behavior:

- the low-offloading dataset should produce a lower score
- the directive/task-oriented dataset should produce a higher score
- the summary page should show updated supporting counts for offloading prompts, artifact requests, and explanation-heavy prompts

### 10. Test reset behavior

1. Import data or capture a few live interactions.
2. Click **Reset local dataset** in **Setup**.
3. Confirm:
   - setup metrics return to zero
   - charts show empty states
   - the summary page shows no-data messaging or a zero score

### 11. Debugging if capture does not work

If a live site is not being captured:

1. Open `chrome://extensions`.
2. Find the extension and open the service worker inspection view.
3. Reload the extension.
4. Reload the target LLM site.
5. Check for console errors in:
   - the page
   - the content script context
   - the extension service worker

The most likely issue is that the site changed its DOM structure and one of the selectors in `content.js` no longer matches the current composer, send button, or assistant response.

## Limitations

- DOM scraping depends on the current layout of ChatGPT, Claude, and Gemini, so selectors may need updates if those sites change.
- The classification system is heuristic, not machine-learned, so some prompts may be misclassified.
- Conversation exports that do not follow the expected `mapping` structure are ignored during import.
