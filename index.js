document.addEventListener("DOMContentLoaded", () => {
  const countryCodes = `
    AX AL DZ AD AO AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG
    BF BI KH CM CA CF TD CL CN CO KM CG CD CR HR CU CY CZ DK DJ DM DO EC EG SV
    EE ET FI FR GA GE DE GH GR GT HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE
    KR KW LV LB LY LT LU MG MY MV ML MT MX MC MN MA MZ MM NP NL NZ NG NO OM PK
    PA PY PE PH PL PT QA RO RU SA SN RS SG SK SI ZA ES LK SD SE CH SY TW TH TN
    TR UG UA AE GB US UY UZ VE VN YE ZM ZW
  `.trim().split(/\s+/);
  
// ///////////////////////////I DID IT MANUALTTY AS THE API KEY DIDN'T WORK///////////////////////////


  const countryCities = {
    AX: ["Mariehamn"],
    AL: ["Tirana"],
    DZ: ["Algiers"],
    AD: ["Andorra la Vella"],
    AO: ["Luanda"],
    AR: ["Buenos Aires", "Cordoba", "Mendoza"],
    AM: ["Yerevan"],
    AU: ["Sydney", "Melbourne", "Brisbane"],
    AT: ["Vienna"],
    AZ: ["Baku"],
    BS: ["Nassau"],
    BH: ["Manama"],
    BD: ["Dhaka"],
    BB: ["Bridgetown"],
    BY: ["Minsk"],
    BE: ["Brussels"],
    BZ: ["Belize City"],
    BJ: ["Porto-Novo"],
    BT: ["Thimphu"],
    BO: ["La Paz"],
    BA: ["Sarajevo"],
    BW: ["Gaborone"],
    BR: ["Rio de Janeiro", "Sao Paulo"],
    BN: ["Bandar Seri Begawan"],
    BG: ["Sofia"],
    BF: ["Ouagadougou"],
    BI: ["Bujumbura"],
    KH: ["Phnom Penh"],
    CM: ["Yaounde"],
    CA: ["Toronto", "Vancouver", "Montreal"],
    CF: ["Bangui"],
    TD: ["N'Djamena"],
    CL: ["Santiago"],
    CN: ["Beijing", "Shanghai"],
    CO: ["Bogota"],
    KM: ["Moroni"],
    CG: ["Brazzaville"],
    CD: ["Kinshasa"],
    CR: ["San Jose"],
    HR: ["Zagreb"],
    CU: ["Havana"],
    CY: ["Nicosia"],
    CZ: ["Prague"],
    DK: ["Copenhagen"],
    DJ: ["Djibouti"],
    DM: ["Roseau"],
    DO: ["Santo Domingo"],
    EC: ["Quito"],
    EG: ["Cairo", "Alexandria", "Giza"],
    SV: ["San Salvador"],
    EE: ["Tallinn"],
    ET: ["Addis Ababa"],
    FI: ["Helsinki"],
    FR: ["Paris", "Lyon", "Marseille"],
    GA: ["Libreville"],
    GE: ["Tbilisi"],
    DE: ["Berlin", "Munich", "Hamburg"],
    GH: ["Accra"],
    GR: ["Athens"],
    GT: ["Guatemala City"],
    HK: ["Hong Kong"],
    HU: ["Budapest"],
    IS: ["Reykjavik"],
    IN: ["New Delhi", "Mumbai", "Jaipur"],
    ID: ["Jakarta", "Bali", "Bandung"],
    IR: ["Tehran"],
    IQ: ["Baghdad"],
    IE: ["Dublin"],
    IL: ["Jerusalem", "Tel Aviv"],
    IT: ["Rome", "Milan", "Venice"],
    JM: ["Kingston"],
    JP: ["Tokyo", "Osaka", "Kyoto"],
    JO: ["Amman", "Aqaba"],
    KZ: ["Astana", "Almaty"],
    KE: ["Nairobi"],
    KR: ["Seoul", "Busan"],
    KW: ["Kuwait City"],
    LV: ["Riga"],
    LB: ["Beirut"],
    LY: ["Tripoli"],
    LT: ["Vilnius"],
    LU: ["Luxembourg"],
    MG: ["Antananarivo"],
    MY: ["Kuala Lumpur", "George Town"],
    MV: ["Male"],
    ML: ["Bamako"],
    MT: ["Valletta"],
    MX: ["Mexico City", "Cancun"],
    MC: ["Monaco"],
    MN: ["Ulaanbaatar"],
    MA: ["Marrakesh", "Casablanca"],
    MZ: ["Maputo"],
    MM: ["Yangon"],
    NP: ["Kathmandu"],
    NL: ["Amsterdam"],
    NZ: ["Auckland", "Wellington"],
    NG: ["Lagos", "Abuja"],
    NO: ["Oslo"],
    OM: ["Muscat"],
    PK: ["Islamabad", "Karachi"],
    PA: ["Panama City"],
    PY: ["Asuncion"],
    PE: ["Lima"],
    PH: ["Manila"],
    PL: ["Warsaw", "Krakow"],
    PT: ["Lisbon", "Porto"],
    QA: ["Doha"],
    RO: ["Bucharest"],
    RU: ["Moscow", "Saint Petersburg"],
    SA: ["Riyadh", "Jeddah"],
    SN: ["Dakar"],
    RS: ["Belgrade"],
    SG: ["Singapore"],
    SK: ["Bratislava"],
    SI: ["Ljubljana"],
    ZA: ["Cape Town", "Johannesburg"],
    ES: ["Madrid", "Barcelona"],
    LK: ["Colombo"],
    SD: ["Khartoum"],
    SE: ["Stockholm"],
    CH: ["Zurich", "Geneva"],
    SY: ["Damascus"],
    TW: ["Taipei"],
    TH: ["Bangkok", "Phuket"],
    TN: ["Tunis"],
    TR: ["Istanbul", "Ankara"],
    UG: ["Kampala"],
    UA: ["Kyiv"],
    AE: ["Dubai", "Abu Dhabi"],
    GB: ["London", "Manchester", "Liverpool"],
    US: ["New York", "Los Angeles", "Chicago"],
    UY: ["Montevideo"],
    UZ: ["Tashkent"],
    VE: ["Caracas"],
    VN: ["Hanoi", "Ho Chi Minh City"],
    YE: ["Sana'a"],
    ZM: ["Lusaka"],
    ZW: ["Harare"],
  };

  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

  const countries = countryCodes
    .map(code => ({
      code,
      name: countryNames.of(code) || code,
      flag: `https://flagcdn.com/w40/${code.toLowerCase()}.png`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let selectedCountry = null;
  let selectedCity = null;
  let selectedYear = "2026";

  const countryTrigger = document.getElementById("countryTrigger");
  const countryDropdown = document.getElementById("countryDropdown");
  const countryOptions = document.getElementById("countryOptions");
  const countrySearch = document.getElementById("countrySearch");
  const selectedFlag = document.getElementById("selectedFlag");
  const selectedCountryText = document.getElementById("selectedCountryText");

  const cityTrigger = document.getElementById("cityTrigger");
  const cityDropdown = document.getElementById("cityDropdown");
  const selectedCityText = document.getElementById("selectedCityText");

  const yearTrigger = document.getElementById("yearTrigger");
  const yearDropdown = document.getElementById("yearDropdown");
  const selectedYearText = document.getElementById("selectedYearText");

  const selectedDestination = document.getElementById("selectedDestination");
  const selectedDestinationFlag = document.getElementById("selectedDestinationFlag");
  const selectedDestinationName = document.getElementById("selectedDestinationName");
  const clearSelectionBtn = document.getElementById("clearSelectionBtn");

  const exploreBtn = document.getElementById("exploreBtn");
  const countryInfoBox = document.getElementById("countryInfoBox");

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
      hour12: true
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

  function updateDashboardSavedPlansCount() {
    const savedPlansCount = document.getElementById("dashboardSavedPlansCount");
    if (!savedPlansCount) return;

    const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
    savedPlansCount.textContent = savedPlans.length;
  }

  function renderCountries(filter = "") {
    const searchValue = filter.toLowerCase();

    const filteredCountries = countries.filter(country =>
      country.name.toLowerCase().includes(searchValue) ||
      country.code.toLowerCase().includes(searchValue)
    );

    if (filteredCountries.length === 0) {
      countryOptions.innerHTML = `<div class="custom-select-option no-results">No countries found</div>`;
      return;
    }

    countryOptions.innerHTML = filteredCountries.map(country => `
      <div class="custom-select-option" data-code="${country.code}">
        <img class="flag-img" src="${country.flag}" alt="${country.name} flag">
        <span class="country-name">${country.name}</span>
        <span class="country-code">${country.code}</span>
      </div>
    `).join("");

    document.querySelectorAll(".custom-select-option[data-code]").forEach(option => {
      option.addEventListener("click", event => {
        event.stopPropagation();

        selectedCountry = countries.find(country => country.code === option.dataset.code);
        selectedCity = null;

        selectedFlag.innerHTML = `<img class="flag-img" src="${selectedCountry.flag}" alt="${selectedCountry.name} flag">`;
        selectedCountryText.textContent = selectedCountry.name;
        selectedCountryText.classList.remove("placeholder");

        selectedCityText.textContent = "Select City";
        selectedCityText.classList.add("placeholder");

        renderCities();
        updateSelectedDestination();
        closeCountryDropdown();
      });
    });
  }

  function renderCities() {
    const cities = selectedCountry ? countryCities[selectedCountry.code] || [] : [];

    if (!selectedCountry) {
      cityDropdown.innerHTML = `<div class="simple-select-option no-results">Select a country first</div>`;
      return;
    }

    if (cities.length === 0) {
      cityDropdown.innerHTML = `<div class="simple-select-option no-results">No city data available</div>`;
      return;
    }

    cityDropdown.innerHTML = cities.map(city => `
      <div class="simple-select-option" data-city="${city}">
        <i class="fa-solid fa-city option-icon"></i>
        <span>${city}</span>
      </div>
    `).join("");

    document.querySelectorAll("#cityDropdown .simple-select-option[data-city]").forEach(option => {
      option.addEventListener("click", event => {
        event.stopPropagation();

        selectedCity = option.dataset.city;
        selectedCityText.textContent = selectedCity;
        selectedCityText.classList.remove("placeholder");

        document.querySelectorAll("#cityDropdown .simple-select-option").forEach(item => {
          item.classList.remove("selected");
        });

        option.classList.add("selected");
        updateSelectedDestination();
        closeCityDropdown();
      });
    });
  }

  function updateSelectedDestination() {
    if (!selectedCountry) return;

    selectedDestinationFlag.innerHTML = `
      <img src="${selectedCountry.flag}" alt="${selectedCountry.name} flag">
    `;

    selectedDestinationName.innerHTML = selectedCity
      ? `${selectedCountry.name}<span class="selected-city-name"> • ${selectedCity}</span>`
      : selectedCountry.name;

    selectedDestination.classList.remove("hidden");
  }

  function openCountryDropdown() {
    countryTrigger.classList.add("open");
    countryDropdown.classList.add("open");
    countrySearch.focus();
  }

  function closeCountryDropdown() {
    countryTrigger.classList.remove("open");
    countryDropdown.classList.remove("open");
  }

  function openCityDropdown() {
    cityTrigger.classList.add("open");
    cityDropdown.classList.add("open");
  }

  function closeCityDropdown() {
    cityTrigger.classList.remove("open");
    cityDropdown.classList.remove("open");
  }

  function openYearDropdown() {
    yearTrigger.classList.add("open");
    yearDropdown.classList.add("open");
  }

  function closeYearDropdown() {
    yearTrigger.classList.remove("open");
    yearDropdown.classList.remove("open");
  }

  function showCountryPlaceholder() {
    countryInfoBox.innerHTML = `
      <div class="country-info-placeholder">
        <div class="placeholder-icon">
          <i class="fa-solid fa-globe"></i>
        </div>
        <p>Select a country to view detailed information</p>
      </div>
    `;
  }

  function showCountryError() {
    countryInfoBox.innerHTML = `
      <div class="country-info-placeholder">
        <div class="placeholder-icon error">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <p>Failed to load country information. Please try again.</p>
      </div>
    `;
  }

  function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");

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

  countryTrigger.addEventListener("click", event => {
    event.stopPropagation();
    closeCityDropdown();
    closeYearDropdown();

    countryDropdown.classList.contains("open")
      ? closeCountryDropdown()
      : openCountryDropdown();
  });

  countrySearch.addEventListener("click", event => {
    event.stopPropagation();
  });

  countrySearch.addEventListener("input", () => {
    renderCountries(countrySearch.value);
  });

  cityTrigger.addEventListener("click", event => {
    event.stopPropagation();
    closeCountryDropdown();
    closeYearDropdown();
    renderCities();

    cityDropdown.classList.contains("open")
      ? closeCityDropdown()
      : openCityDropdown();
  });

  yearTrigger.addEventListener("click", event => {
    event.stopPropagation();
    closeCountryDropdown();
    closeCityDropdown();

    yearDropdown.classList.contains("open")
      ? closeYearDropdown()
      : openYearDropdown();
  });

  document.querySelectorAll("#yearDropdown .simple-select-option").forEach(option => {
    option.addEventListener("click", event => {
      event.stopPropagation();

      selectedYear = option.dataset.year;
      selectedYearText.textContent = selectedYear;

      document.querySelectorAll("#yearDropdown .simple-select-option").forEach(item => {
        item.classList.remove("selected");
      });

      option.classList.add("selected");
      closeYearDropdown();
    });
  });

  clearSelectionBtn.addEventListener("click", () => {
    selectedCountry = null;
    selectedCity = null;

    selectedFlag.innerHTML = "";
    selectedCountryText.textContent = "Select Country";
    selectedCountryText.classList.add("placeholder");

    selectedCityText.textContent = "Select City";
    selectedCityText.classList.add("placeholder");
    renderCities();

    selectedDestination.classList.add("hidden");
    showCountryPlaceholder();
  });

  exploreBtn.addEventListener("click", () => {
    if (!selectedCountry) {
      showToast("Please select a country first", "info");
      return;
    }

    const placeName = selectedCity
      ? `${selectedCountry.name}, ${selectedCity}`
      : selectedCountry.name;

    localStorage.setItem("selectedCountry", JSON.stringify(selectedCountry));
    localStorage.setItem("selectedCity", selectedCity || "");
    localStorage.setItem("selectedYear", selectedYear);

    showToast(`Exploring ${placeName}!`, "success");
    showCountryError();
  });

  document.addEventListener("click", () => {
    closeCountryDropdown();
    closeCityDropdown();
    closeYearDropdown();
  });

  renderCountries();
  renderCities();

  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);

  updateSidebarPlansCount();
  updateDashboardSavedPlansCount();
});