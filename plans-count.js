function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  let savedPlans = [];

  try {
    savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  } catch {
    savedPlans = [];
  }

  const count = Array.isArray(savedPlans) ? savedPlans.length : 0;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

document.addEventListener("DOMContentLoaded", updateSidebarPlansCount);
window.addEventListener("storage", updateSidebarPlansCount);