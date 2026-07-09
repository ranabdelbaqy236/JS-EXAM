document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);

  updateSidebarPlansCount();
  setupCurrencyConverter();
});

let fromCurrency = "USD";
let toCurrency = "";

const countryCurrencyMap = {
  EG: "EGP",
  US: "USD",
  GB: "GBP",
  QA: "QAR",
  AE: "AED",
  SA: "SAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  JO: "JOD",
  LB: "LBP",
  TR: "TRY",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  GR: "EUR",
  IE: "EUR",
  AT: "EUR",
  FI: "EUR",
  LU: "EUR",
  MT: "EUR",
  CY: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  UY: "UYU",
  VE: "VES",
  ZA: "ZAR",
  NG: "NGN",
  MA: "MAD",
  TN: "TND",
  DZ: "DZD",
  KE: "KES",
  GH: "GHS",
  ET: "ETB",
  SD: "SDG",
  UG: "UGX",
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  ID: "IDR",
  PH: "PHP",
  VN: "VND",
  KR: "KRW",
  HK: "HKD",
  TW: "TWD",
  NZ: "NZD",
  PK: "PKR",
  BD: "BDT",
  LK: "LKR",
  NP: "NPR",
  RU: "RUB",
  UA: "UAH",
};

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

function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  const count = savedPlans.length;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

function setupCurrencyConverter() {
  const selectedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
  const amountInput = document.getElementById("currencyAmount");
  const convertBtn = document.getElementById("convertCurrencyBtn");
  const swapBtn = document.getElementById("swapCurrencyBtn");

  if (!selectedCountry) {
    toCurrency = "---";
    updateCurrencyLabels();
    showCurrencyMessage("Select a country from the dashboard first.");
    return;
  }

  toCurrency = getCurrencyByCountryCode(selectedCountry.code);

  updateCurrencyLabels();

  if (amountInput) {
    amountInput.addEventListener("input", () => {
      amountInput.value = amountInput.value.replace(/[^\d.]/g, "");
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", convertCurrency);
  }

  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      if (!toCurrency || toCurrency === "---") return;

      const oldFrom = fromCurrency;
      fromCurrency = toCurrency;
      toCurrency = oldFrom;

      updateCurrencyLabels();
      convertCurrency();
    });
  }
}

function getCurrencyByCountryCode(countryCode) {
  return countryCurrencyMap[countryCode] || "---";
}

function updateCurrencyLabels() {
  const fromLabel = document.getElementById("fromCurrencyLabel");
  const toLabel = document.getElementById("toCurrencyLabel");

  if (fromLabel) fromLabel.textContent = fromCurrency;
  if (toLabel) toLabel.textContent = toCurrency || "---";
}

async function convertCurrency() {
  const amountInput = document.getElementById("currencyAmount");
  const amount = Number(amountInput?.value || 0);

  if (!amount || amount <= 0) {
    showCurrencyMessage("Please enter a valid amount.");
    return;
  }

  if (!toCurrency || toCurrency === "---") {
    showCurrencyMessage("Currency is not available for this country.");
    return;
  }

  showCurrencyMessage("Converting...");

  try {
    const response = await fetch(
      `https://api.fxratesapi.com/latest?base=${fromCurrency}`
    );

    const data = await response.json();
    const rate = data.rates[toCurrency];

    if (!rate) {
      showCurrencyMessage("Exchange rate is not available.");
      return;
    }

    const result = amount * rate;

    showCurrencyMessage(`
      <strong>${formatMoney(amount)} ${fromCurrency}</strong>
      =
      <strong>${formatMoney(result)} ${toCurrency}</strong>
    `);
  } catch (error) {
    showCurrencyMessage("Failed to convert currency. Please try again.");
  }
}

function showCurrencyMessage(message) {
  const resultBox = document.getElementById("quickConvertResult");
  if (!resultBox) return;

  resultBox.innerHTML = message;
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}