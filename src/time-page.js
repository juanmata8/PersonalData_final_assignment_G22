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
const ratioAxisMode = document.getElementById("ratioAxisMode");
const ratioRangeStart = document.getElementById("ratioRangeStart");
const ratioRangeEnd = document.getElementById("ratioRangeEnd");
const countAxisMode = document.getElementById("countAxisMode");
const countRangeStart = document.getElementById("countRangeStart");
const countRangeEnd = document.getElementById("countRangeEnd");
const heatmapGoodToggle = document.getElementById("heatmapGoodToggle");
const heatmapBadToggle = document.getElementById("heatmapBadToggle");
const heatmapUnknownToggle = document.getElementById("heatmapUnknownToggle");

let conversationsCache = [];

function syncDateInputs(startInput, endInput, detail) {
  if (!detail.minDate || !detail.maxDate) {
    return;
  }

  startInput.min = detail.minDate;
  startInput.max = detail.maxDate;
  endInput.min = detail.minDate;
  endInput.max = detail.maxDate;

  if (!startInput.value) {
    startInput.value = detail.minDate;
  }

  if (!endInput.value) {
    endInput.value = detail.maxDate;
  }
}

async function renderPage() {
  if (!conversationsCache.length) {
    conversationsCache = await getConversations();
  }

  const analysis = analyzeConversations(conversationsCache);
  const ratioDetail = buildTimePatternDetail(conversationsCache, {
    axisMode: ratioAxisMode.value,
    startDate: ratioRangeStart.value,
    endDate: ratioRangeEnd.value,
    includeGood: heatmapGoodToggle.checked,
    includeBad: heatmapBadToggle.checked,
    includeUnknown: heatmapUnknownToggle.checked
  });
  const countDetail = buildTimePatternDetail(conversationsCache, {
    axisMode: countAxisMode.value,
    startDate: countRangeStart.value,
    endDate: countRangeEnd.value,
    includeGood: heatmapGoodToggle.checked,
    includeBad: heatmapBadToggle.checked,
    includeUnknown: heatmapUnknownToggle.checked
  });
  const heatmapDetail = buildTimePatternDetail(conversationsCache, {
    axisMode: "hour",
    includeGood: heatmapGoodToggle.checked,
    includeBad: heatmapBadToggle.checked,
    includeUnknown: heatmapUnknownToggle.checked
  });

  syncDateInputs(ratioRangeStart, ratioRangeEnd, ratioDetail);
  syncDateInputs(countRangeStart, countRangeEnd, countDetail);

  renderBarChart(dailyChart, analysis.dailyCounts.slice(-10), {
    emptyMessage: "No interaction history is available yet."
  });
  renderBarChart(weekdayChart, analysis.weekdayCounts, {
    variant: "green",
    emptyMessage: "No weekday pattern is available yet."
  });
  renderHeatGrid(hourlyHeatmap, heatmapDetail.filteredHourlyCounts.map(([hour, value]) => [`${hour.padStart(2, "0")}:00`, value]), {
    emptyMessage: "No hourly pattern is available yet."
  });
  renderDualLineChart(qualityRatioChart, ratioDetail.qualitySeries, {
    yMax: 1,
    goodLabel: "Good prompts",
    badLabel: "Bad prompts",
    unknownLabel: "Unknown prompts",
    yLabel: "Ratio",
    emptyMessage: "No coding prompts are available in the selected interval."
  });
  renderGroupedBarChart(qualityCountChart, countDetail.qualityCountSeries, {
    goodLabel: "Good",
    badLabel: "Bad",
    unknownLabel: "Unknown",
    yLabel: "Count",
    emptyMessage: "No offloading-labeled coding prompts are available in the selected interval."
  });
}

["change", "input"].forEach((eventName) => {
  ratioAxisMode.addEventListener(eventName, () => {
    void renderPage();
  });
  ratioRangeStart.addEventListener(eventName, () => {
    void renderPage();
  });
  ratioRangeEnd.addEventListener(eventName, () => {
    void renderPage();
  });
  countAxisMode.addEventListener(eventName, () => {
    void renderPage();
  });
  countRangeStart.addEventListener(eventName, () => {
    void renderPage();
  });
  countRangeEnd.addEventListener(eventName, () => {
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
