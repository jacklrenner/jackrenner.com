// Get container dimensions dynamically
function getVizDimensions() {
  const vizElement = document.getElementById("viz");
  const rect = vizElement.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

let { width, height } = getVizDimensions();

const svg = d3.select("#viz")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("display", "block");

// -----------------------------
// CAMERA ANGLE (fixed view)
// -----------------------------
const AX = Math.PI / 6;
const AY = Math.PI / 6;

// -----------------------------
// ROTATION FUNCTIONS
// -----------------------------
function rotateX([x,y,z], a) {
  return [
    x,
    y * Math.cos(a) - z * Math.sin(a),
    y * Math.sin(a) + z * Math.cos(a)
  ];
}

function rotateY([x,y,z], a) {
  return [
    x * Math.cos(a) + z * Math.sin(a),
    y,
    -x * Math.sin(a) + z * Math.cos(a)
  ];
}

// -----------------------------
// ORTHOGRAPHIC PROJECTION + CAMERA ROTATION
// -----------------------------
function project(p) {
  let r = rotateY(p, AY);
  r = rotateX(r, AX);

  const scale = Math.min(width, height) / 800;
  const scaleFactor = 210 * scale;

  return [
    width / 2 + r[0] * scaleFactor,
    height / 2 + r[1] * scaleFactor,
    r[2]
  ];
}

// -----------------------------
// CUBE
// -----------------------------
const points = [
  [-1,-1,-1],
  [ 1,-1,-1],
  [ 1, 1,-1],
  [-1, 1,-1],
  [-1,-1, 1],
  [ 1,-1, 1],
  [ 1, 1, 1],
  [-1, 1, 1]
];

const edges = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7]
];

// -----------------------------
// BALL TYPES AND COLORS
// -----------------------------
const BALL_TYPES = [
  { name: 'pm25', color: '#ff6b6b',   sizeMultiplier: 2   },
  { name: 'pm10', color: 'orange',  sizeMultiplier: 6   },
  { name: 'no2',  color: '#4ecdc4',  sizeMultiplier: 1 },
  { name: 'o3',   color: '#45b7d1',  sizeMultiplier: 0.8 },
  { name: 'co',   color: '#6c5ce7',  sizeMultiplier: 1.2   }
];

// Initialize ball counts for each type
window.ballCounts = BALL_TYPES.map(() => 0);

// Control which ball types are visible (default: all enabled)
window.enabledTypes = BALL_TYPES.map(() => true);

// Helper functions to control visibility
window.showOnlyType = function(typeIndex) {
  window.enabledTypes = BALL_TYPES.map((_, i) => i === typeIndex);
};

window.showAllTypes = function() {
  window.enabledTypes = BALL_TYPES.map(() => true);
};

window.toggleType = function(typeIndex) {
  window.enabledTypes[typeIndex] = !window.enabledTypes[typeIndex];
};

// -----------------------------
// BALLS
// -----------------------------
NUM_BALLS = 0;
BALL_RADIUS = 0.01;

let balls = d3.range(window.NUM_BALLS).map(() => ({
  x: Math.random() * 2 - 1,
  y: Math.random() * 2 - 1,
  z: Math.random() * 2 - 1,
  vx: (Math.random() - 0.5) * 0.01,
  vy: (Math.random() - 0.5) * 0.01,
  vz: (Math.random() - 0.5) * 0.01,
  r: BALL_RADIUS * (BALL_TYPES[0]?.sizeMultiplier || 1),
  type: 0
}));

// -----------------------------
// PHYSICS
// -----------------------------
function step() {
  balls.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.z += b.vz;

    if (b.x > 1 - b.r || b.x < -1 + b.r) b.vx *= -1;
    if (b.y > 1 - b.r || b.y < -1 + b.r) b.vy *= -1;
    if (b.z > 1 - b.r || b.z < -1 + b.r) b.vz *= -1;
  });
}

// -----------------------------
// RENDER CUBE
// -----------------------------
function renderCube() {
  const data = edges.map(([a, b]) => {
    const A = project(points[a]);
    const B = project(points[b]);
    return {
      x1: A[0], y1: A[1],
      x2: B[0], y2: B[1]
    };
  });

  svg.selectAll("line")
    .data(data)
    .join("line")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2)
    .attr("y2", d => d.y2)
    .attr("stroke", "#EBD5AB")
    .attr("stroke-width", 2);
}

// -----------------------------
// RENDER BALLS
// -----------------------------
function renderBalls() {
  const scale = Math.min(width, height) / 800;
  const scaleFactor = 210 * scale;

  const enabledBalls = balls.filter(b => window.enabledTypes[b.type]);

  const projected = enabledBalls.map(b => {
    const p = project([b.x, b.y, b.z]);
    return {
      x: p[0],
      y: p[1],
      z: p[2],
      r: b.r * scaleFactor * (1 + p[2] * 0.2),
      opacity: 0.4 + (p[2] + 1) / 2 * 0.6,
      color: BALL_TYPES[b.type].color
    };
  })
  .sort((a, b) => a.z - b.z);

  svg.selectAll("circle")
    .data(projected)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r",  d => d.r)
    .attr("fill", d => d.color)
    .attr("opacity", d => d.opacity);
}

// -----------------------------
// RESETTER
// -----------------------------
function resetter() {
  if (window.reset == true) {
    balls = [];
    BALL_TYPES.forEach((type, typeIndex) => {
      const count = window.ballCounts[typeIndex] || 0;
      for (let i = 0; i < count; i++) {
        balls.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 2 - 1,
          vx: (Math.random() - 0.5) * 0.01,
          vy: (Math.random() - 0.5) * 0.01,
          vz: (Math.random() - 0.5) * 0.01,
          r: BALL_RADIUS * (BALL_TYPES[typeIndex]?.sizeMultiplier || 1),
          type: typeIndex
        });
      }
    });
    console.log("reset with balls:", window.ballCounts, "total:", balls.length);
    window.reset = false;
  }
}

// -----------------------------
// MAIN LOOP
// -----------------------------
function tick() {
  resetter();
  step();
  renderCube();
  renderBalls();
}

// -----------------------------
// RESIZE HANDLER
// -----------------------------
function resizeViz() {
  const newDims = getVizDimensions();
  width = newDims.width;
  height = newDims.height;

  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");
}

window.addEventListener("resize", resizeViz);

// -----------------------------
// HEALTHY AIR PRESET
// -----------------------------
const HEALTHY_AIR = {
  pm25: 5,
  pm10: 15,
  no2:  10,
  o3:   30,
  co:   4
};

window.healthyAirActive = false;
let savedBallCounts   = null;
let savedLegendValues = null;

window.toggleHealthyAir = function() {
  window.healthyAirActive = !window.healthyAirActive;
  const btn = document.getElementById("healthy-air-btn");

  if (window.healthyAirActive) {
    // Save current counts and legend values before switching
    savedBallCounts = [...window.ballCounts];
    savedLegendValues = {
      pm25: document.getElementById("legend-pm25").textContent,
      pm10: document.getElementById("legend-pm10").textContent,
      no2:  document.getElementById("legend-no2").textContent,
      o3:   document.getElementById("legend-o3").textContent,
      co:   document.getElementById("legend-co").textContent,
    };

    window.ballCounts[0] = HEALTHY_AIR.pm25 * 20;
    window.ballCounts[1] = HEALTHY_AIR.pm10 * 10;
    window.ballCounts[2] = HEALTHY_AIR.no2  * 10;
    window.ballCounts[3] = HEALTHY_AIR.o3   * 12;
    window.ballCounts[4] = HEALTHY_AIR.co   * 21;
    btn.classList.add("active");

    document.getElementById("legend-pm25").textContent = HEALTHY_AIR.pm25 + " µg/m³";
    document.getElementById("legend-pm10").textContent = HEALTHY_AIR.pm10 + " µg/m³";
    document.getElementById("legend-no2").textContent  = HEALTHY_AIR.no2  + " µg/m³";
    document.getElementById("legend-o3").textContent   = HEALTHY_AIR.o3   + " µg/m³";
    document.getElementById("legend-co").textContent   = HEALTHY_AIR.co   + " mg/m³";

  } else {
    // Restore saved counts and legend values
    if (savedBallCounts) {
      window.ballCounts = [...savedBallCounts];
    } else {
      window.ballCounts = BALL_TYPES.map(() => 0);
    }

    if (savedLegendValues) {
      document.getElementById("legend-pm25").textContent = savedLegendValues.pm25;
      document.getElementById("legend-pm10").textContent = savedLegendValues.pm10;
      document.getElementById("legend-no2").textContent  = savedLegendValues.no2;
      document.getElementById("legend-o3").textContent   = savedLegendValues.o3;
      document.getElementById("legend-co").textContent   = savedLegendValues.co;
    } else {
      document.getElementById("legend-pm25").textContent = "-- µg/m³";
      document.getElementById("legend-pm10").textContent = "-- µg/m³";
      document.getElementById("legend-no2").textContent  = "-- µg/m³";
      document.getElementById("legend-o3").textContent   = "-- µg/m³";
      document.getElementById("legend-co").textContent   = "-- mg/m³";
    }

    btn.classList.remove("active");
    savedBallCounts   = null;
    savedLegendValues = null;
  }

  window.reset = true;
};

// -----------------------------
// INFO BOX TOGGLE
// -----------------------------
window.toggleInfo = function() {
  const infoBox = document.getElementById("info-box");
  infoBox.classList.toggle("visible");
};

window.toggleVizInfo = function() {
  const infoBox = document.getElementById("viz-info-box");
  infoBox.classList.toggle("visible");
};

// -----------------------------
// START
// -----------------------------
d3.timer(tick);