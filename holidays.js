document.addEventListener("DOMContentLoaded", () => {
  const selectedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
  const selectedYear = localStorage.getItem("selectedYear") || "2026";
  let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

  const holidaysContent = document.getElementById("holidaysContent");
  const holidaysSelection = document.getElementById("holidaysSelection");
  const holidaysFlag = document.getElementById("holidaysFlag");
  const holidaysCountryName = document.getElementById("holidaysCountryName");
  const holidaysYear = document.getElementById("holidaysYear");

  function updateHeaderDateTime() {
    const currentDateTime = document.getElementById("currentDateTime");
    if (!currentDateTime) return;

    const now = new Date();

    currentDateTime.textContent = now.toLocaleString("en-US", {
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
    if (holidaysSelection) holidaysSelection.style.display = "none";

    holidaysContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-calendar-xmark"></i>
        </div>

        <h3>No Country Selected</h3>
        <p>Select a country from the dashboard to explore public holidays</p>

        <a href="../html/main.html" class="btn-primary">
          <i class="fa-solid fa-globe"></i>
          Go to Dashboard
        </a>
      </div>
    `;
  }

  async function loadHolidays() {
    if (!selectedCountry) {
      showNoCountryState();
      return;
    }

    holidaysSelection.style.display = "flex";
    holidaysFlag.src = selectedCountry.flag;
    holidaysFlag.alt = `${selectedCountry.name} flag`;
    holidaysCountryName.textContent = selectedCountry.name;
    holidaysYear.textContent = selectedYear;

    holidaysContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Loading holidays...</p>
      </div>
    `;

    let holidays = [];

    try {
      holidays = await getHolidaysFromNager();
    } catch {
      holidays = [];
    }

    if (!holidays.length) {
      try {
        holidays = await getHolidaysFromDateHolidays();
      } catch {
        holidays = [];
      }
    }

    if (!holidays.length) {
      showNoHolidaysFound();
      return;
    }

    renderHolidays(holidays);
  }

  async function getHolidaysFromNager() {
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${selectedCountry.code}`
    );

    if (!response.ok) {
      throw new Error("Nager API failed");
    }

    const data = await response.json();

    return data.map((holiday) => ({
      date: holiday.date,
      name: holiday.name,
      localName: holiday.localName || holiday.name,
    }));
  }

  async function getHolidaysFromDateHolidays() {
    await loadDateHolidaysLibrary();

    if (!window.Holidays) {
      throw new Error("Holiday library not loaded");
    }

    const hd = new window.Holidays();
    hd.init(selectedCountry.code);

    const data = hd.getHolidays(Number(selectedYear)) || [];

    return data
      .filter((holiday) => holiday.type === "public" || holiday.type === "bank")
      .map((holiday) => ({
        date: holiday.date.split(" ")[0],
        name: holiday.name,
        localName: holiday.name,
      }));
  }

  function loadDateHolidaysLibrary() {
    return new Promise((resolve, reject) => {
      if (window.Holidays) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/date-holidays@3.26.5/dist/date-holidays.min.js";
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  function renderHolidays(holidays) {
    holidaysContent.innerHTML = holidays.map((holiday) => {
      const date = new Date(holiday.date + "T00:00:00");
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const weekday = date.toLocaleString("en-US", { weekday: "long" });
      const saved = isHolidaySaved(holiday);

      const holidayPlan = {
        id: `holiday-${selectedCountry.code}-${selectedYear}-${holiday.date}-${holiday.name}`,
        type: "holiday",
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        year: selectedYear,
        date: holiday.date,
        name: holiday.name,
        localName: holiday.localName || holiday.name,
      };

      return `
        <div class="holiday-card">
          <div class="holiday-card-header">
            <div class="holiday-date-box">
              <span class="day">${day}</span>
              <span class="month">${month}</span>
            </div>

            <button
              class="holiday-action-btn ${saved ? "saved" : ""}"
              type="button"
              data-save-holiday="${encodeURIComponent(JSON.stringify(holidayPlan))}"
            >
              <i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>
          </div>

          <h3>${holiday.localName || holiday.name}</h3>
          <p class="holiday-name">${holiday.name}</p>

          <div class="holiday-card-footer">
            <span class="holiday-day-badge">
              <i class="fa-regular fa-calendar"></i>
              ${weekday}
            </span>

            <div class="holiday-types">
              <span class="holiday-type-badge">Public</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bindSaveHolidayButtons();
  }

  function showNoHolidaysFound() {
    holidaysContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-calendar-xmark"></i>
        </div>
        <h3>No Holidays Found</h3>
        <p>No public holidays found for ${selectedCountry.name} in ${selectedYear}</p>
      </div>
    `;
  }

  function isHolidaySaved(holiday) {
    return savedPlans.some((plan) =>
      plan.type === "holiday" &&
      plan.countryCode === selectedCountry.code &&
      plan.year === selectedYear &&
      plan.date === holiday.date &&
      plan.name === holiday.name
    );
  }

  function bindSaveHolidayButtons() {
    document.querySelectorAll("[data-save-holiday]").forEach((button) => {
      button.addEventListener("click", () => {
        const holidayPlan = JSON.parse(decodeURIComponent(button.dataset.saveHoliday));

        const alreadySaved = savedPlans.some((plan) =>
          plan.type === holidayPlan.type &&
          plan.countryCode === holidayPlan.countryCode &&
          plan.year === holidayPlan.year &&
          plan.date === holidayPlan.date &&
          plan.name === holidayPlan.name
        );

        if (alreadySaved) {
          showToast("Already saved!", "info");
          return;
        }

        savedPlans.push(holidayPlan);
        localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

        button.classList.add("saved");
        button.innerHTML = `<i class="fa-solid fa-heart"></i>`;

        updateSidebarPlansCount();
        showToast("Saved to My Plans!", "success");
      });
    });
  }

  function showToast(message, type = "info") {
    let toastContainer = document.getElementById("toastContainer");

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      toastContainer.id = "toastContainer";
      document.body.appendChild(toastContainer);
    }

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

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);

  updateSidebarPlansCount();
  loadHolidays();
});