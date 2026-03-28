const d3 = globalThis.d3;

function emptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function ensureD3() {
  if (!d3) {
    throw new Error("D3 is not loaded on this page.");
  }
}

function clearContainer(container) {
  container.innerHTML = "";
  return d3.select(container);
}

function createLegend(container, items) {
  const legend = container.append("div").attr("class", "chart-legend");
  const cells = legend.selectAll(".legend-item").data(items).enter().append("span").attr("class", "legend-item");
  cells.append("span").attr("class", (item) => `legend-swatch ${item.className || ""}`.trim());
  cells.append("span").text((item) => item.label);
}

function createResponsiveSvg(container, width, height) {
  return container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "chart-svg")
    .style("width", "100%")
    .style("height", "auto");
}

function applyAxisStyle(selection) {
  selection.selectAll("path").attr("stroke", "rgba(100, 91, 80, 0.24)");
  selection.selectAll("line").attr("stroke", "rgba(100, 91, 80, 0.2)");
  selection.selectAll("text")
    .attr("fill", "#645b50")
    .style("font-size", "10px");
}

export function renderBarChart(container, items, options = {}) {
  ensureD3();
  const root = clearContainer(container);

  if (!items.length) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const data = items.map(([label, value]) => ({ label, value }));
  const width = 720;
  const height = 320;
  const margin = { top: 16, right: 20, bottom: 78, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const fillClass = options.variant === "green" ? "green" : "";

  const svg = createResponsiveSvg(root, width, height);
  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map((item) => item.label)).range([0, innerWidth]).padding(0.22);
  const y = d3.scaleLinear().domain([0, d3.max(data, (item) => item.value) || 1]).nice().range([innerHeight, 0]);

  chart.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth).tickFormat(""))
    .call((group) => {
      group.select(".domain").remove();
      group.selectAll("line").attr("stroke", "rgba(100, 91, 80, 0.12)");
    });

  chart.append("g")
    .call(d3.axisLeft(y).ticks(4))
    .call(applyAxisStyle)
    .selectAll("text")
    .style("font-size", "11px");

  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(applyAxisStyle)
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  chart.selectAll(".bar-track-bg")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (item) => x(item.label))
    .attr("y", 0)
    .attr("width", x.bandwidth())
    .attr("height", innerHeight)
    .attr("rx", 9)
    .attr("class", "chart-bar-track-bg");

  chart.selectAll(".chart-bar-fill")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (item) => x(item.label))
    .attr("y", (item) => y(item.value))
    .attr("width", x.bandwidth())
    .attr("height", (item) => innerHeight - y(item.value))
    .attr("rx", 9)
    .attr("class", `chart-bar-fill ${fillClass}`.trim());

  chart.selectAll(".bar-value")
    .data(data)
    .enter()
    .append("text")
    .attr("x", (item) => (x(item.label) || 0) + x.bandwidth() / 2)
    .attr("y", (item) => y(item.value) - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#201a15")
    .style("font-size", "11px")
    .text((item) => item.value);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 12)
    .attr("class", "bar-axis-label")
    .text(options.yLabel || "Count");
}

export function renderHeatGrid(container, items, options = {}) {
  ensureD3();
  const root = clearContainer(container);

  if (!items.length) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const data = items.map(([label, value]) => ({ label, value }));
  const maxValue = d3.max(data, (item) => item.value) || 1;
  const color = d3.scaleLinear().domain([0, maxValue]).range(["rgba(168, 72, 31, 0.12)", "rgba(168, 72, 31, 0.58)"]);

  const grid = root.append("div").attr("class", "heat-grid");
  const cells = grid.selectAll(".heat-cell").data(data).enter().append("div").attr("class", "heat-cell");
  cells.style("background", (item) => color(item.value));
  cells.append("strong").text((item) => item.label);
  cells.append("span").text((item) => item.value);
}

export function renderWordCloud(container, items, variant = "warm") {
  ensureD3();
  const root = clearContainer(container);

  if (!items.length) {
    container.appendChild(emptyState("No coding-related words are available yet."));
    return;
  }

  const maxValue = d3.max(items, (item) => item.count) || 1;
  const size = d3.scaleLinear().domain([1, maxValue]).range([12, 32]);
  const cloud = root.append("div").attr("class", "word-cloud");

  cloud.selectAll(".word-pill")
    .data(items)
    .enter()
    .append("span")
    .attr("class", `word-pill ${variant === "cool" ? "alt" : ""}`.trim())
    .style("font-size", (item) => `${size(item.count)}px`)
    .text((item) => `${item.word} (${item.count})`);
}

export function renderWordTable(container, items, title) {
  ensureD3();
  const root = clearContainer(container);

  if (!items.length) {
    container.appendChild(emptyState("No word frequency data is available yet."));
    return;
  }

  const table = root.append("table").attr("class", "word-table");
  const thead = table.append("thead").append("tr");
  thead.append("th").text(title);
  thead.append("th").text("Count");

  const rows = table.append("tbody").selectAll("tr").data(items).enter().append("tr");
  rows.append("td").text((item) => item.word);
  rows.append("td").text((item) => item.count);
}

export function renderMetricList(container, items) {
  ensureD3();
  const root = clearContainer(container);

  if (!items.length) {
    container.appendChild(emptyState("No metrics are available yet."));
    return;
  }

  const cards = root.selectAll(".stat-card").data(items).enter().append("div").attr("class", "stat-card");
  cards.append("h2").text((item) => item.label);
  cards.append("div").attr("class", "stat-value").text((item) => item.value);
  cards.append("p").attr("class", "muted").text((item) => item.note);
}

export function renderDualLineChart(container, series, options = {}) {
  ensureD3();
  const root = clearContainer(container);
  const total = [...series.goodValues, ...series.badValues, ...(series.unknownValues || [])].reduce((sum, value) => sum + value, 0);

  if (!series.labels.length || total === 0) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  createLegend(root, [
    { label: options.goodLabel || "Good", className: "green" },
    { label: options.badLabel || "Bad", className: "" },
    ...(series.unknownValues ? [{ label: options.unknownLabel || "Unknown", className: "soft" }] : [])
  ]);

  const width = 760;
  const height = 320;
  const margin = { top: 16, right: 20, bottom: 64, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = series.labels.map((label, index) => ({
    label,
    good: series.goodValues[index],
    bad: series.badValues[index],
    unknown: series.unknownValues ? series.unknownValues[index] : null
  }));

  const svg = createResponsiveSvg(root, width, height);
  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(series.labels).range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, options.yMax ?? 1]).nice().range([innerHeight, 0]);

  chart.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth).tickFormat(""))
    .call((group) => {
      group.select(".domain").remove();
      group.selectAll("line").attr("stroke", "rgba(100, 91, 80, 0.12)");
    });

  chart.append("g")
    .call(d3.axisLeft(y).ticks(4))
    .call(applyAxisStyle);

  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .call(applyAxisStyle)
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  const line = d3.line().x((item) => x(item.label)).y((item) => y(item.value));
  const seriesDefs = [
    { key: "good", className: "good", values: data.map((item) => ({ label: item.label, value: item.good })) },
    { key: "bad", className: "bad", values: data.map((item) => ({ label: item.label, value: item.bad })) },
    ...(series.unknownValues ? [{ key: "unknown", className: "unknown", values: data.map((item) => ({ label: item.label, value: item.unknown })) }] : [])
  ];

  seriesDefs.forEach((definition) => {
    chart.append("path")
      .datum(definition.values)
      .attr("class", `line-path ${definition.className}`)
      .attr("d", line);

    chart.selectAll(`.line-point-${definition.key}`)
      .data(definition.values)
      .enter()
      .append("circle")
      .attr("class", `line-point ${definition.className}`)
      .attr("cx", (item) => x(item.label))
      .attr("cy", (item) => y(item.value))
      .attr("r", 3.5);
  });

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 12)
    .attr("class", "line-axis-label")
    .text(options.yLabel || "Ratio");
}

export function renderGroupedBarChart(container, series, options = {}) {
  ensureD3();
  const root = clearContainer(container);
  const total = [...series.goodValues, ...series.badValues, ...(series.unknownValues || [])].reduce((sum, value) => sum + value, 0);

  if (!series.labels.length || total === 0) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  createLegend(root, [
    { label: options.goodLabel || "Good", className: "green" },
    { label: options.badLabel || "Bad", className: "" },
    ...(series.unknownValues ? [{ label: options.unknownLabel || "Unknown", className: "soft" }] : [])
  ]);

  const width = 760;
  const height = 340;
  const margin = { top: 16, right: 20, bottom: 70, left: 46 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const groupKeys = series.unknownValues ? ["good", "unknown", "bad"] : ["good", "bad"];
  const labels = series.labels;
  const data = labels.map((label, index) => ({
    label,
    good: series.goodValues[index],
    bad: series.badValues[index],
    unknown: series.unknownValues ? series.unknownValues[index] : 0
  }));

  const maxValue = d3.max(data, (item) => d3.max(groupKeys, (key) => item[key])) || 1;
  const svg = createResponsiveSvg(root, width, height);
  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(labels).range([0, innerWidth]).paddingInner(0.34).paddingOuter(0.05);
  const x1 = d3.scaleBand().domain(groupKeys).range([0, x0.bandwidth()]).paddingInner(0.02).paddingOuter(0);
  const y = d3.scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0]);
  const fill = {
    good: "#335c4b",
    bad: "#a8481f",
    unknown: "#c08b2d"
  };

  chart.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth).tickFormat(""))
    .call((group) => {
      group.select(".domain").remove();
      group.selectAll("line").attr("stroke", "rgba(100, 91, 80, 0.12)");
    });

  chart.append("g")
    .call(d3.axisLeft(y).ticks(4))
    .call(applyAxisStyle);

  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .call(applyAxisStyle)
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  const groups = chart.selectAll(".group").data(data).enter().append("g").attr("transform", (item) => `translate(${x0(item.label)},0)`);

  groups.selectAll("rect")
    .data((item) => groupKeys.map((key) => ({ key, value: item[key] })))
    .enter()
    .append("rect")
    .attr("x", (item) => x1(item.key))
    .attr("y", (item) => y(item.value))
    .attr("width", x1.bandwidth())
    .attr("height", (item) => innerHeight - y(item.value))
    .attr("rx", 3)
    .attr("fill", (item) => fill[item.key]);

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 12)
    .attr("class", "bar-axis-label")
    .text(options.yLabel || "Count");
}
