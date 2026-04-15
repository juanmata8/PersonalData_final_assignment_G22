import { getConversations } from "./storage.js";
import { analyzeConversations } from "./analysis.js";
import { renderBarChart, renderWordCloud, renderClassicWordCloud, renderWordTable } from "./charts.js";
import { markActiveNav } from "./page.js";

markActiveNav("categories");

async function renderPage() {
  const conversations = await getConversations();
  const analysis = analyzeConversations(conversations);

  renderBarChart(document.getElementById("topicChart"), analysis.topicCounts, {
    emptyMessage: "No coding-related topics are available yet."
  });

  const promptWords = analysis.promptWords.slice(0, 24);
  const responseWords = analysis.responseWords.slice(0, 24);

  renderWordCloud(document.getElementById("promptCloud"), promptWords);
  renderWordCloud(document.getElementById("responseCloud"), responseWords, "cool");
  renderClassicWordCloud(document.getElementById("promptCloudClassic"), promptWords);
  renderClassicWordCloud(document.getElementById("responseCloudClassic"), responseWords, "cool");
  renderWordTable(document.getElementById("promptTable"), analysis.promptWords.slice(0, 12), "Prompt word");
  renderWordTable(document.getElementById("responseTable"), analysis.responseWords.slice(0, 12), "Response word");
}

void renderPage();
