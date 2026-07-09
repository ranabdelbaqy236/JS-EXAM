document.addEventListener("DOMContentLoaded", () => {
  const selectedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
  const selectedYear = localStorage.getItem("selectedYear") || "2026";
  let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

  const content = document.getElementById("longWeekendContent");
  const selection = document.getElementById("longWeekendSelection");
  const flag = document.getElementById("lwFlag");
  const countryName = document.getElementById("lwCountryName");
  const yearText = document.getElementById("lwYear");

  function updateHeaderDateTime() {
    const currentDateTime = document.getElementById("currentDateTime");
    if (!currentDateTime) return;

    currentDateTime.textContent = new Date().toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  const count = savedPlans.length;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

  function showNoCountryState() {
    if (selection) selection.style.display = "none";

    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-umbrella-beach"></i>
        </div>
        <h3>No Country Selected</h3>
        <p>Select a country from the dashboard to find long weekends</p>
        <a href="../html/main.html" class="btn-primary">
          <i class="fa-solid fa-globe"></i>
          Go to Dashboard
        </a>
      </div>
    `;
  }

  async function loadLongWeekends() {
    if (!selectedCountry) {
      showNoCountryState();
      return;
    }

    selection.style.display = "flex";
    flag.src = selectedCountry.flag;
    flag.alt = `${selectedCountry.name} flag`;
    countryName.textContent = selectedCountry.name;
    yearText.textContent = selectedYear;

    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Loading long weekends...</p>
      </div>
    `;

    try {
      const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${selectedCountry.code}`
      );

      if (!response.ok) throw new Error("Failed to load holidays");

      const holidays = await response.json();
      const weekends = buildLongWeekends(holidays);

      if (!weekends.length) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-calendar-xmark"></i>
            </div>
            <h3>No Long Weekends Found</h3>
            <p>No long weekends found for ${selectedCountry.name} in ${selectedYear}</p>
          </div>
        `;
        return;
      }

      renderLongWeekends(weekends);
    } catch (error) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3>Failed to Load Long Weekends</h3>
          <p>Please try again later</p>
        </div>
      `;
    }
  }

  function buildLongWeekends(holidays) {
    const candidates = [];

    holidays.forEach((holiday) => {
      const date = new Date(holiday.date + "T00:00:00");
      const day = date.getDay();

      if (day === 1) {
        candidates.push(createWeekend(addDays(date, -2), date, holiday, false));
      }

      if (day === 5) {
        candidates.push(createWeekend(date, addDays(date, 2), holiday, false));
      }

      if (day === 2) {
        candidates.push(createWeekend(addDays(date, -3), date, holiday, true));
      }

      if (day === 4) {
        candidates.push(createWeekend(date, addDays(date, 3), holiday, true));
      }

      if (day === 0) {
        candidates.push(createWeekend(addDays(date, -1), addDays(date, 1), holiday, false));
      }

      if (day === 6) {
        candidates.push(createWeekend(date, addDays(date, 2), holiday, false));
      }
    });

    return removeDuplicateWeekends(candidates)
      .sort((a, b) => a.start - b.start)
      .slice(0, 12)
      .map((item, index) => ({
        ...item,
        title: `Long Weekend #${index + 1}`,
      }));
  }

  function createWeekend(start, end, holiday, bridgeDay) {
    const days = getDateRange(start, end);

    return {
      id: `${formatIso(start)}-${formatIso(end)}-${holiday.name}`,
      start,
      end,
      days,
      duration: days.length,
      holiday,
      bridgeDay,
    };
  }

  function removeDuplicateWeekends(items) {
    const map = new Map();

    items.forEach((item) => {
      const key = `${formatIso(item.start)}-${formatIso(item.end)}`;
      if (!map.has(key)) map.set(key, item);
    });

    return Array.from(map.values());
  }

  function renderLongWeekends(weekends) {
    content.innerHTML = weekends.map((item) => {
      const saved = isSaved(item);
      const startDate = formatIso(item.start);
      const endDate = formatIso(item.end);

      const plan = {
        id: `longWeekend-${selectedCountry.code}-${selectedYear}-${startDate}-${endDate}`,
        type: "longWeekend",
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        year: selectedYear,
        title: item.title,
        name: item.title,
        start: startDate,
        end: endDate,
        startDate,
        endDate,
        date: `${formatDate(item.start)} - ${formatDate(item.end)}`,
        duration: item.duration,
        days: item.duration,
        holiday: item.holiday.name,
        detail: item.bridgeDay ? "Bridge day needed" : "No extra days needed",
        note: item.bridgeDay ? "Bridge day needed" : "No extra days needed",
        bridgeDay: item.bridgeDay,
        requiresBridgeDay: item.bridgeDay,
      };

      return `
        <div class="lw-card">
          <div class="lw-card-header">
            <span class="lw-badge">
              <i class="fa-solid fa-calendar-days"></i>
              ${item.duration} Days
            </span>

            <button
              class="holiday-action-btn ${saved ? "saved" : ""}"
              type="button"
              data-save-lw="${encodeURIComponent(JSON.stringify(plan))}"
            >
              <i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>
          </div>

          <h3>${item.title}</h3>

          <div class="lw-dates">
            <i class="fa-regular fa-calendar"></i>
            <span>${formatDate(item.start)} - ${formatDate(item.end)}</span>
          </div>

          <div class="lw-info-box ${item.bridgeDay ? "warning" : "success"}">
            <i class="fa-solid ${item.bridgeDay ? "fa-circle-info" : "fa-circle-check"}"></i>
            <span>${item.bridgeDay ? "Requires taking a bridge day off" : "No extra days off needed!"}</span>
          </div>

          <div class="lw-days-visual" style="--lw-days-count: ${item.days.length};">
            ${item.days.map((day) => renderDayCell(day)).join("")}
          </div>
        </div>
      `;
    }).join("");

    bindSaveButtons();
  }

  function renderDayCell(date) {
    const isWeekend = [0, 6].includes(date.getDay());
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dayNumber = date.getDate();

    return `
      <div class="lw-day ${isWeekend ? "weekend" : ""}">
        <div class="name">${dayName}</div>
        <div class="num">${dayNumber}</div>
      </div>
    `;
  }

  function bindSaveButtons() {
    document.querySelectorAll("[data-save-lw]").forEach((button) => {
      button.addEventListener("click", () => {
        const plan = JSON.parse(decodeURIComponent(button.dataset.saveLw));

        const alreadySaved = savedPlans.some((item) =>
          item.type === plan.type &&
          item.id === plan.id
        );

        if (alreadySaved) {
          showToast("Already saved!", "info");
          return;
        }

        savedPlans.push(plan);
        localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

        button.classList.add("saved");
        button.innerHTML = `<i class="fa-solid fa-heart"></i>`;

        updateSidebarPlansCount();
        showToast("Saved to My Plans!", "success");
      });
    });
  }

  function isSaved(item) {
    const startDate = formatIso(item.start);
    const endDate = formatIso(item.end);
    const id = `longWeekend-${selectedCountry.code}-${selectedYear}-${startDate}-${endDate}`;

    return savedPlans.some((plan) =>
      plan.type === "longWeekend" &&
      plan.id === id
    );
  }

  function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = type === "success" ? "fa-circle-check" : "fa-circle-info";

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
      <button class="toast-close" type="button">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    setTimeout(() => toast.remove(), 3000);
  }

  function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function getDateRange(start, end) {
    const dates = [];
    let current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  }

  function formatIso(date) {
    return date.toISOString().split("T")[0];
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);

  updateSidebarPlansCount();
  loadLongWeekends();
});