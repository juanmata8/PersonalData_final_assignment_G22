function emptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

export function renderBarChart(container, items, options = {}) {
  container.innerHTML = "";

  if (!items.length) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const maxValue = Math.max(...items.map(([, value]) => value), 1);
  const wrapper = document.createElement("div");
  wrapper.className = "chart";

  items.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "bar-chart-item";

    const labelEl = document.createElement("strong");
    labelEl.textContent = label;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = `bar-fill ${options.variant === "green" ? "green" : ""}`.trim();
    fill.style.width = `${(value / maxValue) * 100}%`;
    track.appendChild(fill);

    const valueEl = document.createElement("span");
    valueEl.textContent = String(value);

    row.append(labelEl, track, valueEl);
    wrapper.appendChild(row);
  });

  container.appendChild(wrapper);
}

export function renderHeatGrid(container, items, options = {}) {
  container.innerHTML = "";

  if (!items.length) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const maxValue = Math.max(...items.map(([, value]) => value), 1);
  const grid = document.createElement("div");
  grid.className = "heat-grid";

  items.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.className = "heat-cell";
    const intensity = value / maxValue;
    cell.style.background = `rgba(168, 72, 31, ${0.12 + intensity * 0.45})`;

    const title = document.createElement("strong");
    title.textContent = label;
    const count = document.createElement("span");
    count.textContent = String(value);

    cell.append(title, count);
    grid.appendChild(cell);
  });

  container.appendChild(grid);
}

export function renderWordCloud(container, items, variant = "warm") {
  container.innerHTML = "";

  if (!items.length) {
    container.appendChild(emptyState("No coding-related words are available yet."));
    return;
  }

  const maxValue = Math.max(...items.map((item) => item.count), 1);
  const cloud = document.createElement("div");
  cloud.className = "word-cloud";

  items.forEach((item) => {
    const pill = document.createElement("span");
    pill.className = `word-pill ${variant === "cool" ? "alt" : ""}`.trim();
    pill.style.fontSize = `${0.82 + (item.count / maxValue) * 1.2}rem`;
    pill.textContent = `${item.word} (${item.count})`;
    cloud.appendChild(pill);
  });

  container.appendChild(cloud);
}

export function renderWordTable(container, items, title) {
  container.innerHTML = "";

  if (!items.length) {
    container.appendChild(emptyState("No word frequency data is available yet."));
    return;
  }

  const table = document.createElement("table");
  table.className = "word-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>${title}</th>
        <th>Count</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${item.word}</td><td>${item.count}</td>`;
    tbody.appendChild(row);
  });

  container.appendChild(table);
}

export function renderMetricList(container, items) {
  container.innerHTML = "";

  if (!items.length) {
    container.appendChild(emptyState("No metrics are available yet."));
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<h2>${item.label}</h2><div class="stat-value">${item.value}</div><p class="muted">${item.note}</p>`;
    container.appendChild(card);
  });
}

export function renderDualLineChart(container, series, options = {}) {
  container.innerHTML = "";

  const total = [...series.goodValues, ...series.badValues].reduce((sum, value) => sum + value, 0);

  if (!series.labels.length || total === 0) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 16, bottom: 42, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const yMax = options.yMax ?? 1;

  const buildPath = (values) =>
    values
      .map((value, index) => {
        const x = padding.left + (series.labels.length === 1 ? plotWidth / 2 : (index / (series.labels.length - 1)) * plotWidth);
        const y = padding.top + plotHeight - (Math.min(value, yMax) / yMax) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const legend = document.createElement("div");
  legend.className = "chart-legend";
  legend.innerHTML = `
    <span class="legend-item"><span class="legend-swatch green"></span>${options.goodLabel || "Good"}</span>
    <span class="legend-item"><span class="legend-swatch"></span>${options.badLabel || "Bad"}</span>
  `;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "line-chart-svg");

  for (let step = 0; step <= 4; step += 1) {
    const ratio = step / 4;
    const y = padding.top + plotHeight - ratio * plotHeight;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(padding.left));
    line.setAttribute("x2", String(width - padding.right));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("class", "line-grid");
    svg.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "8");
    label.setAttribute("y", String(y + 4));
    label.setAttribute("class", "line-axis-label");
    label.textContent = (ratio * yMax).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    svg.appendChild(label);
  }

  const goodPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  goodPath.setAttribute("d", buildPath(series.goodValues));
  goodPath.setAttribute("class", "line-path good");
  svg.appendChild(goodPath);

  const badPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  badPath.setAttribute("d", buildPath(series.badValues));
  badPath.setAttribute("class", "line-path bad");
  svg.appendChild(badPath);

  series.labels.forEach((labelText, index) => {
    const x = padding.left + (series.labels.length === 1 ? plotWidth / 2 : (index / (series.labels.length - 1)) * plotWidth);

    [
      { value: series.goodValues[index], className: "line-point good" },
      { value: series.badValues[index], className: "line-point bad" }
    ].forEach((point) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const y = padding.top + plotHeight - (Math.min(point.value, yMax) / yMax) * plotHeight;
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "4");
      circle.setAttribute("class", point.className);
      svg.appendChild(circle);
    });

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(height - 12));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "line-axis-label");
    label.textContent = labelText;
    svg.appendChild(label);
  });

  container.append(legend, svg);
}

export function renderGroupedBarChart(container, series, options = {}) {
  container.innerHTML = "";

  const total = [...series.goodValues, ...series.badValues].reduce((sum, value) => sum + value, 0);

  if (!series.labels.length || total === 0) {
    container.appendChild(emptyState(options.emptyMessage || "No data available."));
    return;
  }

  const maxValue = Math.max(...series.goodValues, ...series.badValues, 1);
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  legend.innerHTML = `
    <span class="legend-item"><span class="legend-swatch green"></span>${options.goodLabel || "Good"}</span>
    <span class="legend-item"><span class="legend-swatch"></span>${options.badLabel || "Bad"}</span>
  `;

  const width = 720;
  const height = 320;
  const padding = { top: 20, right: 12, bottom: 52, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const groupWidth = plotWidth / series.labels.length;
  const barWidth = Math.min(20, Math.max(8, groupWidth * 0.28));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "bar-chart-svg");

  for (let step = 0; step <= 4; step += 1) {
    const ratio = step / 4;
    const y = padding.top + plotHeight - ratio * plotHeight;
    const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gridLine.setAttribute("x1", String(padding.left));
    gridLine.setAttribute("x2", String(width - padding.right));
    gridLine.setAttribute("y1", String(y));
    gridLine.setAttribute("y2", String(y));
    gridLine.setAttribute("class", "bar-grid");
    svg.appendChild(gridLine);

    const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yLabel.setAttribute("x", "10");
    yLabel.setAttribute("y", String(y + 4));
    yLabel.setAttribute("class", "bar-axis-label");
    yLabel.textContent = String(Math.round(ratio * maxValue));
    svg.appendChild(yLabel);
  }

  series.labels.forEach((label, index) => {
    const groupCenter = padding.left + groupWidth * index + groupWidth / 2;
    const bars = [
      { value: series.goodValues[index], className: "good", offset: -barWidth / 2 - 2, title: options.goodLabel || "Good" },
      { value: series.badValues[index], className: "bad", offset: barWidth / 2 + 2, title: options.badLabel || "Bad" }
    ];

    bars.forEach((barSpec) => {
      const barHeight = (barSpec.value / maxValue) * plotHeight;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(groupCenter + barSpec.offset - barWidth / 2));
      rect.setAttribute("y", String(padding.top + plotHeight - barHeight));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(Math.max(barHeight, 1)));
      rect.setAttribute("rx", "4");
      rect.setAttribute("class", `bar-rect ${barSpec.className}`);
      rect.setAttribute("title", `${barSpec.title}: ${barSpec.value}`);
      svg.appendChild(rect);
    });

    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", String(groupCenter));
    xLabel.setAttribute("y", String(height - 16));
    xLabel.setAttribute("text-anchor", "middle");
    xLabel.setAttribute("class", "bar-axis-label");
    xLabel.textContent = label;
    svg.appendChild(xLabel);
  });

  const yAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
  yAxisTitle.setAttribute("x", "18");
  yAxisTitle.setAttribute("y", String(padding.top - 2));
  yAxisTitle.setAttribute("class", "bar-axis-label");
  yAxisTitle.textContent = options.yLabel || "Count";
  svg.appendChild(yAxisTitle);

  container.append(legend, svg);
}
