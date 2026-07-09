document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);

  renderSunTimes();
});

function updateCurrentDateTime() {
  const dateTimeElement = document.getElementById("currentDateTime");
  if (!dateTimeElement) return;

  const now = new Date();

  dateTimeElement.textContent = now.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getSelectedCountry() {
  try {
    return JSON.parse(localStorage.getItem("selectedCountry"));
  } catch {
    return null;
  }
}

function getSelectedCity() {
  return localStorage.getItem("selectedCity") || "";
}

async function renderSunTimes() {
  const country = getSelectedCountry();
  const city = getSelectedCity();
  const container = document.getElementById("sunTimesContent");

  if (!container) return;

  if (!country || !city) {
    renderEmptyState(container);
    return;
  }

  updateHeroSelection(country, city);

  container.innerHTML = `
    <div class="sun-loading">
      <i class="fa-solid fa-sun"></i>
      <p>Loading sun times...</p>
    </div>
  `;

  try {
    const location = await getCityCoordinates(city, country.name);
    const sunData = await getSunTimes(location.latitude, location.longitude);

    renderSunTimesData(container, {
      city,
      country,
      timezone: location.timezone,
      sunData,
    });
  } catch {
    container.innerHTML = `
      <div class="sun-error">
        <div class="sun-error-icon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2>Failed to load sun times</h2>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

function updateHeroSelection(country, city) {
  const flag = document.getElementById("sunTimesFlag");
  const countryName = document.getElementById("sunTimesCountryName");
  const cityName = document.getElementById("sunTimesCityName");

  if (flag) {
    flag.src = country.flag || "";
    flag.alt = country.name || "";
  }

  if (countryName) countryName.textContent = country.name || "Selected Country";
  if (cityName) cityName.textContent = city ? `• ${city}` : "";
}

async function getCityCoordinates(city, countryName) {
  const query = encodeURIComponent(`${city}, ${countryName}`);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || !data.results.length) {
    throw new Error("City not found");
  }

  return data.results[0];
}

async function getSunTimes(latitude, longitude) {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${today}&formatted=0`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error("Sun times failed");
  }

  return data.results;
}

function renderSunTimesData(container, data) {
  const { city, timezone, sunData } = data;

  const sunrise = formatTime(sunData.sunrise, timezone);
  const sunset = formatTime(sunData.sunset, timezone);
  const solarNoon = formatTime(sunData.solar_noon, timezone);
  const dawn = formatTime(sunData.civil_twilight_begin, timezone);
  const dusk = formatTime(sunData.civil_twilight_end, timezone);

  const daylight = formatDuration(sunData.day_length);
  const daylightPercent = getDaylightPercent(sunData.day_length);
  const darkness = formatDuration(86400 - Number(sunData.day_length || 0));

  const today = new Date();
  const dateText = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });

  const weekdayText = today.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: timezone,
  });

  container.innerHTML = `
    <div class="sun-times-card">
      <div class="sun-times-top">
        <div>
          <h2>
            <i class="fa-solid fa-location-dot"></i>
            ${escapeHTML(city)}
          </h2>
          <p>Sun times for your selected location</p>
        </div>

        <div class="sun-date">
          <strong>${dateText}</strong>
          <span>${weekdayText}</span>
        </div>
      </div>

      <div class="sun-times-grid">
        ${createSunItem("fa-solid fa-moon", "Dawn", dawn, "Civil Twilight", "purple")}
        ${createSunItem("fa-solid fa-sun", "Sunrise", sunrise, "Golden Hour Start", "yellow")}
        ${createSunItem("fa-solid fa-sun", "Solar Noon", solarNoon, "Sun at Highest", "orange")}
        ${createSunItem("fa-solid fa-sun", "Sunset", sunset, "Golden Hour End", "red")}
        ${createSunItem("fa-solid fa-moon", "Dusk", dusk, "Civil Twilight", "purple")}
        ${createSunItem("fa-solid fa-hourglass-half", "Day Length", daylight, "Total Daylight", "green")}
      </div>
    </div>

    <div class="daylight-card">
      <h2>
        <i class="fa-solid fa-chart-pie"></i>
        Daylight Distribution
      </h2>

      <div class="daylight-bar">
        <div class="daylight-fill" style="width: ${daylightPercent}%;"></div>
      </div>

      <div class="daylight-stats">
        <div>
          <strong>${daylight}</strong>
          <span>Daylight</span>
        </div>

        <div>
          <strong>${daylightPercent.toFixed(1)}%</strong>
          <span>of 24 Hours</span>
        </div>

        <div>
          <strong>${darkness}</strong>
          <span>Darkness</span>
        </div>
      </div>
    </div>
  `;
}

function createSunItem(icon, label, value, caption, color) {
  return `
    <div class="sun-time-item">
      <i class="${icon} sun-${color}"></i>
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${caption}</p>
    </div>
  `;
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="sun-times-empty">
      <div class="empty-icon">
        <i class="fa-solid fa-sun"></i>
      </div>

      <h2>No City Selected</h2>
      <p>Select a country and city from the dashboard to see<br />sunrise and sunset times</p>

      <a href="../html/main.html" class="go-dashboard-btn">
        <i class="fa-solid fa-globe"></i>
        Go to Dashboard
      </a>
    </div>
  `;
}

function formatTime(value, timezone) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

function getDaylightPercent(seconds) {
  return (Number(seconds || 0) / 86400) * 100;
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  const count = savedPlans.length;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}