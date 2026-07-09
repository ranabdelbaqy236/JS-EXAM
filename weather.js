document.addEventListener("DOMContentLoaded", () => {
  const selectedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
  const selectedCity = localStorage.getItem("selectedCity") || "";
  let sunSymbolTimer = null;

  const weatherContent = document.getElementById("weatherContent");
  const weatherSelection = document.getElementById("weatherSelection");
  const weatherFlag = document.getElementById("weatherFlag");
  const weatherCountryName = document.getElementById("weatherCountryName");
  const weatherCityName = document.getElementById("weatherCityName");

  function updateHeaderDateTime() {
    const currentDateTime = document.getElementById("currentDateTime");
    if (!currentDateTime) return;

    currentDateTime.textContent = new Date().toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  function showNoCityState() {
    if (weatherSelection) weatherSelection.style.display = "none";

    weatherContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-cloud-sun"></i>
        </div>
        <h3>No City Selected</h3>
        <p>Select a country and city from the dashboard to check the weather forecast</p>
        <a href="main.html" class="btn-primary">
          <i class="fa-solid fa-globe"></i>
          Go to Dashboard
        </a>
      </div>
    `;
  }

  function showLoadingState() {
    weatherContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Loading weather forecast...</p>
      </div>
    `;
  }

  async function getCoordinates() {
    const params = new URLSearchParams({
      name: selectedCity,
      count: "1",
      language: "en",
      format: "json"
    });

    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
    const data = await response.json();
    const city = data.results?.find(item => item.country_code === selectedCountry.code) || data.results?.[0];

    if (!city) throw new Error("City not found");

    return {
      latitude: city.latitude,
      longitude: city.longitude,
      name: city.name
    };
  }

  async function getWeather(latitude, longitude) {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "7"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error("Weather request failed");

    return response.json();
  }

  async function loadWeather() {
    if (!selectedCountry || !selectedCity) {
      showNoCityState();
      return;
    }

    weatherSelection.style.display = "flex";
    weatherFlag.src = selectedCountry.flag;
    weatherFlag.alt = `${selectedCountry.name} flag`;
    weatherCountryName.textContent = selectedCountry.name;
    weatherCityName.textContent = selectedCity;

    showLoadingState();

    try {
      const coordinates = await getCoordinates();
      const weather = await getWeather(coordinates.latitude, coordinates.longitude);
      renderWeather(weather, coordinates.name);
      startSunLiveSymbols();
    } catch (error) {
      weatherContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3>Failed to Load Weather</h3>
          <p>Please try another city or check your connection</p>
        </div>
      `;
    }
  }

  function renderWeather(weather, cityName) {
    const current = weather.current;
    const daily = weather.daily;
    const hourly = weather.hourly;
    const todayInfo = getWeatherInfo(current.weather_code);

    const todayDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    weatherContent.innerHTML = `
      <div class="weather-hero-card ${todayInfo.heroClass}">
        <div class="weather-hero-bg"></div>
        <div class="weather-hero-content">
          <div class="weather-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${cityName}</span>
            <span class="weather-time">${todayDate}</span>
          </div>

          <div class="weather-hero-main">
            <div class="weather-hero-left">
              <i class="${todayInfo.icon} weather-hero-icon"></i>
              <div class="weather-hero-temp">
                <span class="temp-value">${Math.round(current.temperature_2m)}</span>
                <span class="temp-unit">°C</span>
              </div>
            </div>

            <div class="weather-hero-right">
              <div class="weather-condition">${todayInfo.label}</div>
              <div class="weather-feels">Feels like ${Math.round(current.apparent_temperature)}°C</div>
              <div class="weather-high-low">
                <span class="high"><i class="fa-solid fa-arrow-up"></i>${Math.round(daily.temperature_2m_max[0])}°</span>
                <span class="low"><i class="fa-solid fa-arrow-down"></i>${Math.round(daily.temperature_2m_min[0])}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="weather-details-grid">
        ${renderWeatherDetails(current, daily)}
      </div>

      <div class="weather-section">
        <h3 class="weather-section-title">
          <i class="fa-solid fa-clock"></i>
          Hourly Forecast
        </h3>
        <div class="hourly-scroll">
          ${renderHourlyForecast(hourly)}
        </div>
      </div>

      <div class="weather-section">
        <h3 class="weather-section-title">
          <i class="fa-solid fa-calendar-days"></i>
          7-Day Forecast
        </h3>
        <div class="forecast-list">
          ${renderDailyForecast(daily)}
        </div>
      </div>
    `;
  }

  function renderWeatherDetails(current, daily) {
    const uv = Math.round(daily.uv_index_max[0] || 0);
    const precipitation = daily.precipitation_probability_max[0] || 0;

    return `
      <div class="weather-detail-card">
        <div class="detail-icon humidity"><i class="fa-solid fa-droplet"></i></div>
        <div class="detail-info">
          <span class="detail-label">Humidity</span>
          <span class="detail-value">${current.relative_humidity_2m}%</span>
        </div>
        <div class="detail-bar"><div class="detail-bar-fill" style="width:${current.relative_humidity_2m}%"></div></div>
      </div>

      <div class="weather-detail-card">
        <div class="detail-icon wind"><i class="fa-solid fa-wind"></i></div>
        <div class="detail-info">
          <span class="detail-label">Wind</span>
          <span class="detail-value">${Math.round(current.wind_speed_10m)} km/h</span>
        </div>
        <div class="detail-extra">${getWindDirection(current.wind_direction_10m)}</div>
      </div>

      <div class="weather-detail-card">
        <div class="detail-icon uv"><i class="fa-solid fa-sun"></i></div>
        <div class="detail-info">
          <span class="detail-label">UV Index</span>
          <span class="detail-value">${uv}</span>
        </div>
        <div class="uv-meter ${getUvClass(uv)}">
          <span>${getUvLabel(uv)}</span>
        </div>
      </div>

      <div class="weather-detail-card">
        <div class="detail-icon precip"><i class="fa-solid fa-cloud-rain"></i></div>
        <div class="detail-info">
          <span class="detail-label">Precipitation</span>
          <span class="detail-value">${precipitation}%</span>
        </div>
        <div class="detail-extra">${current.precipitation || 0}mm expected</div>
      </div>

      <div class="weather-detail-card sunrise-sunset">
        <div class="sun-cycle-card">
          <div class="sun-cycle-time sunrise">
            <div class="sun-cycle-icon live-symbol">
              <span class="sun-live-symbol">!</span>
            </div>
            <span class="sun-cycle-label">Sunrise</span>
            <strong>${formatTime(daily.sunrise[0])}</strong>
          </div>

          <div class="sun-cycle-arc">
            <div class="sun-cycle-path"></div>
            <div class="sun-cycle-dot"></div>
          </div>

          <div class="sun-cycle-time sunset">
            <div class="sun-cycle-icon live-symbol">
              <span class="sun-live-symbol">!</span>
            </div>
            <span class="sun-cycle-label">Sunset</span>
            <strong>${formatTime(daily.sunset[0])}</strong>
          </div>
        </div>
      </div>
    `;
  }

  function renderHourlyForecast(hourly) {
    const now = new Date();
    const tomorrow6AM = new Date(now);

    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);
    tomorrow6AM.setHours(6, 0, 0, 0);

    const hours = hourly.time
      .map((time, index) => ({
        time,
        index,
        date: new Date(time)
      }))
      .filter(hour => hour.date >= now && hour.date <= tomorrow6AM);

    return hours.map((hour, cardIndex) => {
      const info = getWeatherInfo(hourly.weather_code[hour.index]);

      const hourLabel = cardIndex === 0
        ? "Now"
        : hour.date.toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true
          });

      const precip = hourly.precipitation_probability[hour.index] || 0;

      return `
        <div class="hourly-item ${cardIndex === 0 ? "now" : ""}">
          <div class="hourly-time">${hourLabel}</div>
          <i class="${info.icon} hourly-icon"></i>
          <div class="hourly-temp">${Math.round(hourly.temperature_2m[hour.index])}°</div>
          ${precip ? `<div class="hourly-precip"><i class="fa-solid fa-droplet"></i>${precip}%</div>` : ""}
        </div>
      `;
    }).join("");
  }

  function renderDailyForecast(daily) {
    return daily.time.map((date, index) => {
      const info = getWeatherInfo(daily.weather_code[index]);
      const dayDate = new Date(date + "T00:00:00");

      const dayLabel = index === 0
        ? "TODAY"
        : dayDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

      const shortDate = dayDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short"
      });

      const precip = daily.precipitation_probability_max[index] || 0;

      return `
        <div class="forecast-day ${index === 0 ? "today" : ""}">
          <div class="forecast-day-name">
            <span class="day-label">${dayLabel}</span>
            <span class="day-date">${shortDate}</span>
          </div>
          <i class="${info.icon} forecast-icon"></i>
          <div class="forecast-temps">
            <span class="temp-max">${Math.round(daily.temperature_2m_max[index])}°</span>
            <span class="temp-min">${Math.round(daily.temperature_2m_min[index])}°</span>
          </div>
          <div class="forecast-precip">
            <i class="fa-solid fa-droplet"></i>
            ${precip}%
          </div>
        </div>
      `;
    }).join("");
  }

  function startSunLiveSymbols() {
    const symbols = document.querySelectorAll(".sun-live-symbol");
    if (!symbols.length) return;

    if (sunSymbolTimer) clearInterval(sunSymbolTimer);

    let showBang = true;

    sunSymbolTimer = setInterval(() => {
      symbols.forEach(symbol => {
        symbol.textContent = showBang ? "?" : "!";
      });

      showBang = !showBang;
    }, 700);
  }

  function getWeatherInfo(code) {
    if ([0, 1].includes(code)) return { label: "Clear", icon: "fa-solid fa-sun", heroClass: "weather-sunny" };
    if ([2].includes(code)) return { label: "Partly Cloudy", icon: "fa-solid fa-cloud-sun", heroClass: "weather-cloudy" };
    if ([3, 45, 48].includes(code)) return { label: "Overcast", icon: "fa-solid fa-cloud", heroClass: "weather-cloudy" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: "Rainy", icon: "fa-solid fa-cloud-rain", heroClass: "weather-rainy" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snowy", icon: "fa-solid fa-snowflake", heroClass: "weather-snowy" };
    if ([95, 96, 99].includes(code)) return { label: "Stormy", icon: "fa-solid fa-cloud-bolt", heroClass: "weather-stormy" };
    return { label: "Cloudy", icon: "fa-solid fa-cloud", heroClass: "weather-default" };
  }

  function getWindDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(degrees / 45) % 8];
  }

  function getUvClass(uv) {
    if (uv <= 2) return "low";
    if (uv <= 5) return "moderate";
    if (uv <= 7) return "high";
    if (uv <= 10) return "very-high";
    return "extreme";
  }

  function getUvLabel(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);
  loadWeather();
});

function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  const count = savedPlans.length;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}