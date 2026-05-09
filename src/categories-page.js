import { getConversations } from "./storage.js";
import { analyzeConversations } from "./analysis.js";
import { renderBarChart, renderClassicWordCloud, renderLollipopChart } from "./charts.js";
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

  renderClassicWordCloud(document.getElementById("promptCloudClassic"), promptWords);
  renderClassicWordCloud(document.getElementById("responseCloudClassic"), responseWords, "cool");
  renderLollipopChart(document.getElementById("promptLollipop"), promptWords.slice(0, 14), { xLabel: "Count" });
  renderLollipopChart(document.getElementById("responseLollipop"), responseWords.slice(0, 14), { variant: "cool", xLabel: "Count" });
}

void renderPage();
