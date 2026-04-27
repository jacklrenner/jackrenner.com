// Latest figures from BP Statistical Review 2023 / Worldometer
// Sources:
//   Oil reserves:     BP Statistical Review of World Energy 2023
//                     https://www.bp.com/en/global/corporate/energy-economics/statistical-review-of-world-energy.html
//   Gas reserves:     BP Statistical Review of World Energy 2023
//   Coal reserves:    BP Statistical Review of World Energy 2023
//   Oil consumption:  IEA Oil Market Report 2023 — ~100 million barrels/day
//                     https://www.iea.org/reports/oil-market-report-june-2023
//   Gas consumption:  IEA Gas Market Report 2023 — ~4 trillion cubic feet/year
//                     https://www.iea.org/reports/gas-market-report-q2-2023
//   Coal consumption: IEA Coal Market Update 2023 — ~8.3 billion short tons/year
//                     https://www.iea.org/reports/coal-market-update-2023

const FALLBACK_RESERVES = {
  oil:  1687000000000,   // 1,687 billion barrels
  gas:  6599000000000,   // 6,599 trillion cubic feet
  coal: 1074000000000    // 1,074 billion short tons
};

// Consumption per second (based on annual figures)
const CONSUMPTION_PER_SECOND = {
  oil:  (100_000_000 * 365) / (365 * 24 * 60 * 60),       // 100M barrels/day → per second
  gas:  (4_000_000_000_000) / (365 * 24 * 60 * 60),        // 4 trillion cubic feet/year → per second
  coal: (8_300_000_000) / (365 * 24 * 60 * 60)             // 8.3 billion short tons/year → per second
};

const EIA_KEY = "vR1C7DYwn6pstdI5wuSomXD5xhHy78PlYmD8iYyE";

const EIA_ENDPOINTS = {
  oil:  `https://api.eia.gov/v2/international/data/?api_key=${EIA_KEY}&frequency=annual&data[0]=value&facets[activityId][]=1&facets[productId][]=57&facets[unit][]=BKBLS&sort[0][column]=period&sort[0][direction]=desc&length=1`,
  gas:  `https://api.eia.gov/v2/international/data/?api_key=${EIA_KEY}&frequency=annual&data[0]=value&facets[activityId][]=1&facets[productId][]=26&facets[unit][]=TCF&sort[0][column]=period&sort[0][direction]=desc&length=1`,
  coal: `https://api.eia.gov/v2/international/data/?api_key=${EIA_KEY}&frequency=annual&data[0]=value&facets[activityId][]=1&facets[productId][]=44&facets[unit][]=BST&sort[0][column]=period&sort[0][direction]=desc&length=1`
};

async function fetchReserve(type) {
  if (EIA_KEY === "YOUR_API_KEY_HERE") return null;

  try {
    const res   = await fetch(EIA_ENDPOINTS[type]);
    const json  = await res.json();
    const value = json?.response?.data?.[0]?.value;
    return value != null ? parseFloat(value) * 1_000_000_000 : null;
  } catch (e) {
    console.warn(`EIA fetch failed for ${type}, using fallback.`);
    return null;
  }
}

async function loadReserves() {
  const [oil, gas, coal] = await Promise.all([
    fetchReserve("oil"),
    fetchReserve("gas"),
    fetchReserve("coal")
  ]);

  // Use API values if available, otherwise fallback
  const reserves = {
    oil:  oil  ?? FALLBACK_RESERVES.oil,
    gas:  gas  ?? FALLBACK_RESERVES.gas,
    coal: coal ?? FALLBACK_RESERVES.coal
  };

  // Record the start time so we can calculate elapsed seconds
  const startTime = Date.now();

  function updateCounters() {
    const elapsed = (Date.now() - startTime) / 1000; // seconds since page load

    const currentOil  = reserves.oil  - (CONSUMPTION_PER_SECOND.oil  * elapsed);
    const currentGas  = reserves.gas  - (CONSUMPTION_PER_SECOND.gas  * elapsed);
    const currentCoal = reserves.coal - (CONSUMPTION_PER_SECOND.coal * elapsed);

    document.getElementById("oil-value").textContent  = Math.max(0, Math.round(currentOil)).toLocaleString('en-US');
    document.getElementById("gas-value").textContent  = Math.max(0, Math.round(currentGas)).toLocaleString('en-US');
    document.getElementById("coal-value").textContent = Math.max(0, Math.round(currentCoal)).toLocaleString('en-US');
  }

  // Update every 100ms for a smooth countdown effect
  updateCounters();
  setInterval(updateCounters, 100);
}

loadReserves();