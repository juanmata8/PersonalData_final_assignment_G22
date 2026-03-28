import { getConversations } from "./storage.js";
import { analyzeConversations } from "./analysis.js";
import { renderBarChart, renderWordCloud, renderWordTable } from "./charts.js";
import { markActiveNav } from "./page.js";

markActiveNav("categories");

async function renderPage() {
  const conversations = await getConversations();
  const analysis = analyzeConversations(conversations);

  renderBarChart(document.getElementById("topicChart"), analysis.topicCounts, {
    emptyMessage: "No coding-related topics are available yet."
  });
  renderWordCloud(document.getElementById("promptCloud"), analysis.promptWords.slice(0, 24));
  renderWordCloud(document.getElementById("responseCloud"), analysis.responseWords.slice(0, 24), "cool");
  renderWordTable(document.getElementById("promptTable"), analysis.promptWords.slice(0, 12), "Prompt word");
  renderWordTable(document.getElementById("responseTable"), analysis.responseWords.slice(0, 12), "Response word");
}

void renderPage();
