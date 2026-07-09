let activeFilter = "all";
let planToRemoveId = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDateTime();
  setInterval(updateCurrentDateTime, 1000);

  renderPlans();
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

function getSavedPlans() {
  try {
    const plans = JSON.parse(localStorage.getItem("savedPlans"));
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
}

function savePlans(plans) {
  localStorage.setItem("savedPlans", JSON.stringify(plans));
}

function normalizeType(type) {
  return String(type || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

function getPlanType(plan) {
  const type = normalizeType(plan.type || plan.category || plan.kind);

  if (type.includes("holiday")) return "holiday";
  if (type.includes("event")) return "event";
  if (type.includes("weekend")) return "long-weekend";

  return "holiday";
}

function renderPlans() {
  const plans = getSavedPlans();
  const plansList = document.getElementById("plansList");
  const emptyState = document.getElementById("plansEmpty");

  setupTabs();
  updatePlansCounts(plans);

  if (!plansList || !emptyState) return;

  const filteredPlans = plans.filter(plan => {
    if (activeFilter === "all") return true;
    return getPlanType(plan) === activeFilter;
  });

  if (!filteredPlans.length) {
    plansList.innerHTML = "";
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";
  plansList.innerHTML = filteredPlans.map(createPlanCard).join("");

  document.querySelectorAll(".remove-plan-btn").forEach(button => {
    button.addEventListener("click", () => {
      showRemoveModal(button.dataset.id);
    });
  });
}

function updatePlansCounts(plans = getSavedPlans()) {
  const holidays = plans.filter(plan => getPlanType(plan) === "holiday").length;
  const events = plans.filter(plan => getPlanType(plan) === "event").length;
  const weekends = plans.filter(plan => getPlanType(plan) === "long-weekend").length;
  const total = holidays + events + weekends;

  setCount("allCount", total);
  setCount("holidaysCount", holidays);
  setCount("eventsCount", events);
  setCount("weekendsCount", weekends);
  setCount("sidebarPlansCount", total);
}

function setCount(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setupTabs() {
  const tabs = document.querySelectorAll(".plan-tab");
  const filters = ["all", "holiday", "event", "long-weekend"];

  tabs.forEach((tab, index) => {
    tab.onclick = () => {
      activeFilter = filters[index] || "all";

      tabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      renderPlans();
    };
  });
}

function createPlanCard(plan) {
  const type = getPlanType(plan);
  const id = getPlanId(plan);
  const title = plan.title || plan.name || "Saved Plan";
  const date = plan.date || plan.localDate || plan.startDate || plan.displayDate || "";
  const subtitle = plan.name || plan.title || plan.description || plan.subtitle || title;

  return `
    <div class="saved-plan-card">
      <span class="saved-plan-badge ${type}">
        ${formatType(type)}
      </span>

      <h3>${escapeHTML(title)}</h3>

      ${date ? `
        <p class="saved-plan-meta">
          <i class="fa-regular fa-calendar"></i>
          <span>${escapeHTML(formatSavedDate(date))}</span>
        </p>
      ` : ""}

      <p class="saved-plan-meta">
        <i class="fa-solid fa-circle-info"></i>
        <span>${escapeHTML(subtitle)}</span>
      </p>

      <button class="remove-plan-btn" type="button" data-id="${escapeHTML(id)}">
        <i class="fa-solid fa-trash"></i>
        Remove
      </button>
    </div>
  `;
}

function getPlanId(plan) {
  return String(
    plan.id ||
    plan.name ||
    plan.title ||
    `${plan.type}-${plan.date}-${plan.subtitle}`
  );
}

function showRemoveModal(id) {
  planToRemoveId = id;

  hideClearModal();
  hideNoPlansModal();

  const modal = document.getElementById("removeModalOverlay");
  if (modal) modal.classList.add("is-visible");
}

function hideRemoveModal() {
  planToRemoveId = null;

  const modal = document.getElementById("removeModalOverlay");
  if (modal) modal.classList.remove("is-visible");
}

function confirmRemovePlan() {
  if (!planToRemoveId) return;

  const plans = getSavedPlans();
  const updatedPlans = plans.filter(plan => getPlanId(plan) !== planToRemoveId);

  savePlans(updatedPlans);

  hideRemoveModal();
  renderPlans();
  showRemovedSuccess();
}

function showRemovedSuccess() {
  const modal = document.getElementById("removedSuccessOverlay");
  if (!modal) return;

  modal.classList.add("is-visible");

  setTimeout(() => {
    modal.classList.remove("is-visible");
  }, 1300);
}

function formatType(type) {
  if (type === "holiday") return "Holiday";
  if (type === "event") return "Event";
  return "Long Weekend";
}

function formatSavedDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function handleClearAllClick() {
  const plans = getSavedPlans();

  hideClearModal();
  hideNoPlansModal();
  hideRemoveModal();

  if (!plans.length) {
    showNoPlansModal();
    return;
  }

  showClearModal();
}

function showClearModal() {
  const modal = document.getElementById("clearModalOverlay");
  if (modal) modal.classList.add("is-visible");
}

function hideClearModal() {
  const modal = document.getElementById("clearModalOverlay");
  if (modal) modal.classList.remove("is-visible");
}

function showNoPlansModal() {
  const modal = document.getElementById("noPlansModalOverlay");
  if (modal) modal.classList.add("is-visible");
}

function hideNoPlansModal() {
  const modal = document.getElementById("noPlansModalOverlay");
  if (modal) modal.classList.remove("is-visible");
}

function clearAllPlans() {
  localStorage.removeItem("savedPlans");

  hideClearModal();

  const plansList = document.getElementById("plansList");
  const emptyState = document.getElementById("plansEmpty");

  if (plansList) plansList.innerHTML = "";
  if (emptyState) emptyState.style.display = "flex";

  setCount("allCount", 0);
  setCount("holidaysCount", 0);
  setCount("eventsCount", 0);
  setCount("weekendsCount", 0);
  setCount("sidebarPlansCount", 0);

  renderPlans();
  showClearedSuccess();
}

function showClearedSuccess() {
  const modal = document.getElementById("clearedSuccessOverlay");
  if (!modal) return;

  modal.classList.add("is-visible");

  setTimeout(() => {
    modal.classList.remove("is-visible");
  }, 1300);
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