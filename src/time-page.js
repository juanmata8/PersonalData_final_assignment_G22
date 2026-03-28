import { getConversations } from "./storage.js";
import { analyzeConversations, buildTimePatternDetail } from "./analysis.js";
import { renderBarChart, renderDualLineChart, renderGroupedBarChart, renderHeatGrid } from "./charts.js";
import { markActiveNav } from "./page.js";

markActiveNav("time");

const dailyChart = document.getElementById("dailyChart");
const weekdayChart = document.getElementById("weekdayChart");
const hourlyHeatmap = document.getElementById("hourlyHeatmap");
const qualityRatioChart = document.getElementById("qualityRatioChart");
const qualityCountChart = document.getElementById("qualityCountChart");
const timeAxisMode = document.getElementById("timeAxisMode");
const timeRangeStart = document.getElementById("timeRangeStart");
const timeRangeEnd = document.getElementById("timeRangeEnd");
const heatmapGoodToggle = document.getElementById("heatmapGoodToggle");
const heatmapBadToggle = document.getElementById("heatmapBadToggle");
const heatmapUnknownToggle = document.getElementById("heatmapUnknownToggle");

let conversationsCache = [];

function syncDateInputs(detail) {
  if (!detail.minDate || !detail.maxDate) {
    return;
  }

  timeRangeStart.min = detail.minDate;
  timeRangeStart.max = detail.maxDate;
  timeRangeEnd.min = detail.minDate;
  timeRangeEnd.max = detail.maxDate;

  if (!timeRangeStart.value) {
    timeRangeStart.value = detail.minDate;
  }

  if (!timeRangeEnd.value) {
    timeRangeEnd.value = detail.maxDate;
  }
}

async function renderPage() {
  if (!conversationsCache.length) {
    conversationsCache = await getConversations();
  }

  const analysis = analyzeConversations(conversationsCache);
  const detail = buildTimePatternDetail(conversationsCache, {
    axisMode: timeAxisMode.value,
    startDate: timeRangeStart.value,
    endDate: timeRangeEnd.value,
    includeGood: heatmapGoodToggle.checked,
    includeBad: heatmapBadToggle.checked,
    includeUnknown: heatmapUnknownToggle.checked
  });

  syncDateInputs(detail);

  renderBarChart(dailyChart, analysis.dailyCounts.slice(-10), {
    emptyMessage: "No interaction history is available yet."
  });
  renderBarChart(weekdayChart, analysis.weekdayCounts, {
    variant: "green",
    emptyMessage: "No weekday pattern is available yet."
  });
  renderHeatGrid(hourlyHeatmap, detail.filteredHourlyCounts.map(([hour, value]) => [`${hour.padStart(2, "0")}:00`, value]), {
    emptyMessage: "No hourly pattern is available yet."
  });
  renderDualLineChart(qualityRatioChart, detail.qualitySeries, {
    yMax: 1,
    goodLabel: "Good prompts",
    badLabel: "Bad prompts",
    unknownLabel: "Unknown prompts",
    yLabel: "Ratio",
    emptyMessage: "No coding prompts are available in the selected interval."
  });
  renderGroupedBarChart(qualityCountChart, detail.qualityCountSeries, {
    goodLabel: "Good",
    badLabel: "Bad",
    unknownLabel: "Unknown",
    yLabel: "Count",
    emptyMessage: "No offloading-labeled coding prompts are available in the selected interval."
  });
}

["change", "input"].forEach((eventName) => {
  timeAxisMode.addEventListener(eventName, () => {
    void renderPage();
  });
  timeRangeStart.addEventListener(eventName, () => {
    void renderPage();
  });
  timeRangeEnd.addEventListener(eventName, () => {
    void renderPage();
  });
  heatmapGoodToggle.addEventListener(eventName, () => {
    void renderPage();
  });
  heatmapBadToggle.addEventListener(eventName, () => {
    void renderPage();
  });
  heatmapUnknownToggle.addEventListener(eventName, () => {
    void renderPage();
  });
});

void renderPage();
