import { getConversations } from "./storage.js";
import { analyzeConversations } from "./analysis.js";
import { markActiveNav } from "./page.js";
import { renderMetricList } from "./charts.js";

markActiveNav("summary");

async function renderPage() {
  const conversations = await getConversations();
  const analysis = analyzeConversations(conversations);
  const score = analysis.scoreMetrics.score;
  const scoreMetrics = analysis.scoreMetrics;

  document.getElementById("scoreRing").style.setProperty("--score", String(score));
  document.getElementById("scoreValue").textContent = String(score);
  document.getElementById("reflectionText").textContent = analysis.reflection;
  document.getElementById("recommendationText").textContent = analysis.recommendation;
  document.getElementById("scoreBreakdown").innerHTML = `
    <p><strong>Offloading prompts:</strong> ${scoreMetrics.delegationCount ?? 0}</p>
    <p><strong>Artifact requests:</strong> ${scoreMetrics.outputTypeCount ?? 0}</p>
    <p><strong>Explanation-heavy prompts:</strong> ${scoreMetrics.explanationCount ?? 0}</p>
    <p class="muted">Formula: 70% offloading ratio + 20% artifact ratio - 10% explanation ratio, then bounded to 0-100 with small concept/artifact adjustments.</p>
  `;

  renderMetricList(document.getElementById("summaryMetrics"), [
    {
      label: "Coding Interactions",
      value: String(analysis.totalCodingInteractions),
      note: "Only coding-related rows contribute to the offloading score"
    },
    {
      label: "Top Topic",
      value: analysis.topicCounts[0]?.[0] || "No data",
      note: "Most frequent coding category in the current dataset"
    },
    {
      label: "Strongest Pattern",
      value: analysis.strongestPattern?.label || "No data",
      note: "Broadest time-of-day bucket with the highest interaction count"
    }
  ]);
}

void renderPage();
