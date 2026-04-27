
// -----------------------------
// 1. Sidebar toggle
// -----------------------------
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

toggleBtn.addEventListener("click", () => {
  const isCollapsed = sidebar.classList.toggle("collapsed");

  const mapEl = document.getElementById("map");

  if (isCollapsed) {
    // hide map when sidebar closes
    mapEl.classList.add("hidden");
  } else {
    // show map when sidebar opens
    mapEl.classList.remove("hidden");

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
});

// -----------------------------
// 1.5 Pollutant visibility toggles
// -----------------------------
const pollutantToggles = [
  { id: 'pm25-toggle', index: 0 },
  { id: 'pm10-toggle', index: 1 },
  { id: 'no2-toggle', index: 2 },
  { id: 'o3-toggle', index: 3 },
  { id: 'co-toggle', index: 4 }
];

// Add event listeners for individual pollutant toggles
pollutantToggles.forEach(({ id, index }) => {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.addEventListener('change', () => {
      window.enabledTypes[index] = checkbox.checked;
    });
  }
});

// Add event listener for "All" toggle button
const allToggleBtn = document.getElementById('all-toggle');
if (allToggleBtn) {
  allToggleBtn.addEventListener('click', () => {
    const allChecked = window.enabledTypes.every(type => type);
    if (allChecked) {
      // If all are checked, uncheck all
      window.showAllTypes();
      window.enabledTypes = window.enabledTypes.map(() => false);
    } else {
      // If not all are checked, check all
      window.showAllTypes();
    }

    // Update checkboxes to match
    pollutantToggles.forEach(({ id, index }) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = window.enabledTypes[index];
      }
    });
  });
}

// -----------------------------
// 2. Initialize Leaflet map
// -----------------------------
const usaBounds = L.latLngBounds(
  [24.396308, -124.848974],
  [49.384358, -66.885444]
);

const map = L.map("map", {
  maxBounds: usaBounds,
  maxBoundsViscosity: 1.0,
  zoom: 3,
  center: [39, -95]
});

map.setMinZoom(3);
map.setMaxZoom(30);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Fix initial render (important since sidebar starts collapsed)
window.addEventListener("load", () => {
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
});

// -----------------------------
// 3. Marker handling
// -----------------------------
let marker = null;

// -----------------------------
// 4. AQI API setup
// -----------------------------
const API_KEY = "d570116329cfc916bbabbd9ef1f19a6a432a2daa";

const lastKnown = {
  pm25: null,
  pm10: null,
  no2: null,
  o3: null,
  co: null
};

const getValue = (iaqi, key) => iaqi?.[key]?.v ?? null;

const fallbackFromAQI = (aqi) => {
  if (aqi == null) return null;
  return aqi * 0.5;
};

// -----------------------------
// 5. API functions
// -----------------------------
async function fetchAQICNByGeo(lat, lon) {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "ok") {
    throw new Error("AQICN fetch failed");
  }

  return data.data;
}

async function fetchNearbyStations(lat, lon) {
  const url = `https://api.waqi.info/search/?keyword=${lat},${lon}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "ok") return [];
  return data.data || [];
}

async function fetchStationByUID(uid) {
  const url = `https://api.waqi.info/feed/@${uid}/?token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "ok") return null;
  return data.data;
}

// -----------------------------
// 6. Core AQI logic
// -----------------------------
async function getAirQuality(lat, lon) {
  const mainData = await fetchAQICNByGeo(lat, lon);

  let pollutants = {
    pm25: { value: null, source: null },
    pm10: { value: null, source: null },
    no2: { value: null, source: null },
    o3: { value: null, source: null },
    co: { value: null, source: null }
  };

  const iaqi = mainData.iaqi || {};

  // Step 1: live data
  for (let key in pollutants) {
    const val = getValue(iaqi, key);
    if (val != null) {
      pollutants[key] = { value: val, source: "live" };
      lastKnown[key] = val;
    }
  }

  // Step 2: nearby stations
  const missingKeys = Object.keys(pollutants).filter(
    k => pollutants[k].value == null
  );

  if (missingKeys.length > 0) {
    const stations = await fetchNearbyStations(lat, lon);

    for (let station of stations) {
      if (missingKeys.length === 0) break;

      const stationData = await fetchStationByUID(station.uid);
      if (!stationData) continue;

      const stationIAQI = stationData.iaqi || {};

      for (let key of [...missingKeys]) {
        const val = getValue(stationIAQI, key);
        if (val != null) {
          pollutants[key] = { value: val, source: "nearby" };
          lastKnown[key] = val;
          missingKeys.splice(missingKeys.indexOf(key), 1);
        }
      }
    }
  }

  // Step 3: fallback
  for (let key in pollutants) {
    if (pollutants[key].value == null) {
      if (lastKnown[key] != null) {
        pollutants[key] = {
          value: lastKnown[key],
          source: "cached"
        };
      } else {
        pollutants[key] = {
          value: fallbackFromAQI(mainData.aqi) ?? 0,
          source: "estimated"
        };
      }
    }
  }

  return {
    aqi: mainData.aqi,
    time: mainData.time?.s,
    pollutants
  };
}

// -----------------------------
// 7. Click handler (main feature)
// -----------------------------
let requestId = 0;

function updateLegendValues(values) {
  document.getElementById('legend-pm25').textContent = values.pm25 != null ? values.pm25.toFixed(1) + ' µg/m³' : '-- µg/m³';
  document.getElementById('legend-pm10').textContent = values.pm10 != null ? values.pm10.toFixed(1) + ' µg/m³' : '-- µg/m³';
  document.getElementById('legend-no2').textContent  = values.no2  != null ? values.no2.toFixed(1)  + ' µg/m³' : '-- µg/m³';
  document.getElementById('legend-o3').textContent   = values.o3   != null ? values.o3.toFixed(1)   + ' µg/m³' : '-- µg/m³';
  document.getElementById('legend-co').textContent   = values.co   != null ? values.co.toFixed(1)   + ' mg/m³' : '-- mg/m³';
}

map.on("click", async (e) => {
  const currentRequest = ++requestId;

  const lat = e.latlng.lat;
  const lon = e.latlng.lng;

  console.log("Clicked:", lat, lon);

  // Marker
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map);

  try {
    const data = await getAirQuality(lat, lon);

    // Prevent race condition
    if (currentRequest !== requestId) return;

    const pollutantArray = Object.entries(data.pollutants).map(
      ([key, obj]) => ({
        type: key,
        value: obj.value,
        source: obj.source
      })
    );

    console.log("Pollutants:", pollutantArray);

    // Set individual ball counts for each pollutant type
    const pm25 = pollutantArray.find(p => p.type === "pm25")?.value || 0;
    const pm10 = pollutantArray.find(p => p.type === "pm10")?.value || 0;
    const no2 = pollutantArray.find(p => p.type === "no2")?.value || 0;
    const o3 = pollutantArray.find(p => p.type === "o3")?.value || 0;
    const co = pollutantArray.find(p => p.type === "co")?.value || 0;

    // Scale the values and set ball counts (adjust multipliers as needed) for better visualization
    window.ballCounts = [
      Math.min(pm25 * 20, 500),  // PM2.5
      Math.min(pm10 * 10, 300),   // PM10
      Math.min(no2 * 10, 200),   // NO2
      Math.min(o3 * 12, 240),    // O3
      Math.min(co * 21, 100)       // CO
    ];
    console.log(window.ballCounts);

    updateLegendValues({ pm25, pm10, no2, o3, co });

    let num_cigarette = document.getElementById("num_cigarette");
    num_cigarette.textContent = (pm25/22).toFixed(1);
    window.reset = true;

    console.log("Ball counts:", window.ballCounts);

  } catch (err) {
    console.error("Air quality fetch failed:", err);
  }
});