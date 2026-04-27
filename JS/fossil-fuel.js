// Responsive D3 Orthographic 3D Visualization: Energy Volumes vs NYC (vertical cubes, true isometric)

const data = [
  { name: "NYC", volume: 7.89e9, color: "#888" },
  { name: "Oil (100M barrels)", volume: 1.59e7, color: "#e6b800" },
  { name: "Natural Gas (11B m³)", volume: 1.1e10, color: "#1f77b4" },
  { name: "Coal (22M tons)", volume: 2.86e7, color: "#333" }
];

// Responsive SVG setup
const baseWidth = 700, baseHeight = 400, margin = 60;
const svg = d3.select("#visualization")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

// Isometric projection parameters (true isometric)
const isoX = 0.866, isoY = 0.5;

// Find scale for cube heights (cube root of volume)
const maxCubeSize = 90;
const minCubeSize = 24;
const scale = d3.scalePow()
  .exponent(1/3)
  .domain([d3.min(data, d => d.volume), d3.max(data, d => d.volume)])
  .range([minCubeSize, maxCubeSize]);

// Function to get isometric cube points (true cube)
function getCubePoints(cx, cy, size) {
  // cx, cy: center bottom of the cube
  // size: cube edge length

  // Calculate the 8 corners of the cube
  // Bottom face
  const front = [cx, cy];
  const right = [cx + isoX * size, cy - isoY * size];
  const back = [cx, cy - isoY * 2 * size];
  const left = [cx - isoX * size, cy - isoY * size];

  // Top face (just subtract size in y for height)
  const frontTop = [front[0], front[1] - size];
  const rightTop = [right[0], right[1] - size];
  const backTop = [back[0], back[1] - size];
  const leftTop = [left[0], left[1] - size];

  return {
    top: [leftTop, frontTop, rightTop, backTop],
    left: [left, leftTop, frontTop, front],
    right: [front, frontTop, rightTop, right],
  };
}

// Draw cubes
// ...existing code...

const spacing = 140;

// Calculate cube sizes
const cubeSizes = data.map(d => scale(d.volume));
// Calculate total width of all cubes and spacings
const totalWidth = (cubeSizes.length - 1) * spacing + cubeSizes.reduce((a, b) => a + b, 0);
// Add an offset to move the cubes to the right
const rightOffset = 60; // Increase this value to move further right
const startX = (baseWidth - totalWidth) / 2 + cubeSizes[0] / 2 + rightOffset;

let currentX = startX;
data.forEach((d, i) => {
  const size = cubeSizes[i];
  const cx = currentX;
  const cy = baseHeight - margin;

  const faces = getCubePoints(cx, cy, size);

  // Draw left face
  svg.append("polygon")
    .attr("points", faces.left.map(p => p.join(",")).join(" "))
    .attr("fill", d3.color(d.color).darker(0.7))
    .attr("stroke", "#222")
    .attr("stroke-width", 1);

  // Draw right face
  svg.append("polygon")
    .attr("points", faces.right.map(p => p.join(",")).join(" "))
    .attr("fill", d3.color(d.color).darker(1.2))
    .attr("stroke", "#222")
    .attr("stroke-width", 1);

  // Draw top face
  svg.append("polygon")
    .attr("points", faces.top.map(p => p.join(",")).join(" "))
    .attr("fill", d.color)
    .attr("stroke", "#222")
    .attr("stroke-width", 1);

  // Add label
  svg.append("text")
    .attr("x", cx)
    .attr("y", cy + 22)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text(d.name);

  // Add volume label
  svg.append("text")
    .attr("x", cx)
    .attr("y", cy + 38)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .text(d3.format(".2s")(d.volume) + " m³");

  // Move to next cube position
  currentX += spacing;
});