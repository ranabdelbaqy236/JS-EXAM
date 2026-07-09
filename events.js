document.addEventListener("DOMContentLoaded", () => {
  const TICKETMASTER_API_KEY = "MPxADEPGC8AMs7YK11FtU470gKcMaZP4";

  const selectedCountry = JSON.parse(localStorage.getItem("selectedCountry"));
  const selectedCity = localStorage.getItem("selectedCity") || "";
  let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];

  const eventsContent = document.getElementById("eventsContent");
  const eventsSelection = document.getElementById("eventsSelection");
  const eventsFlag = document.getElementById("eventsFlag");
  const eventsCountryName = document.getElementById("eventsCountryName");
  const eventsCityName = document.getElementById("eventsCityName");

  const renderedEventPlans = new Map();

  const eventGroups = [
    { label: "Parties", keyword: "party", classificationName: "music" },
    { label: "Arts & Theatre", classificationName: "arts & theatre" },
    { label: "Sports", classificationName: "sports" }
  ];

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
    if (eventsSelection) eventsSelection.style.display = "none";

    eventsContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-ticket"></i>
        </div>

        <h3>No City Selected</h3>

        <p>Select a country and city from the dashboard to discover events</p>

        <a href="../index.html" class="btn-primary">
          <i class="fa-solid fa-globe"></i>
          Go to Dashboard
        </a>
      </div>
    `;
  }

  function showLoadingState() {
    eventsContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Loading events...</p>
      </div>
    `;
  }

  function showApiKeyState() {
    eventsContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-key"></i>
        </div>

        <h3>API Key Required</h3>

        <p>Add your Ticketmaster API key in events.js to load real parties, arts, and sports events</p>
      </div>
    `;
  }

  function setupSelectionBadge() {
    eventsSelection.style.display = "flex";
    eventsFlag.src = selectedCountry.flag;
    eventsFlag.alt = `${selectedCountry.name} flag`;
    eventsCountryName.textContent = selectedCountry.name;
    eventsCityName.textContent = selectedCity;
  }

  async function fetchTicketmasterEvents(group) {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      countryCode: selectedCountry.code,
      classificationName: group.classificationName,
      size: "20",
      sort: "date,asc"
    });

    if (selectedCity) {
      params.set("city", selectedCity);
    }

    if (group.keyword) {
      params.set("keyword", group.keyword);
    }

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const events = data._embedded?.events || [];

    return events.map(event => ({
      ...event,
      displayCategory: group.label
    }));
  }

  async function loadEvents() {
    if (!selectedCountry || !selectedCity) {
      showNoCityState();
      return;
    }

    setupSelectionBadge();
    showLoadingState();

    if (!TICKETMASTER_API_KEY || TICKETMASTER_API_KEY === "YOUR_API_KEY_HERE") {
      showApiKeyState();
      return;
    }

    try {
      const groupedEvents = await Promise.all(
        eventGroups.map(group => fetchTicketmasterEvents(group))
      );

      const allEvents = groupedEvents.flat();

      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.id, event])).values()
      );

      if (!uniqueEvents.length) {
        eventsContent.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-ticket"></i>
            </div>

            <h3>No Events Found</h3>

            <p>No parties, artistic, or sporting events found for ${selectedCity}, ${selectedCountry.name}</p>
          </div>
        `;
        return;
      }

      renderEvents(uniqueEvents);
    } catch (error) {
      eventsContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>

          <h3>Failed to Load Events</h3>

          <p>Please check your API key or try again later</p>
        </div>
      `;
    }
  }

  function normalizeTicketmasterEvent(event) {
    const venue = event._embedded?.venues?.[0];
    const classification = event.classifications?.[0];
    const price = event.priceRanges?.[0];

    const eventDate = event.dates?.start?.localDate || "";
    const eventTime = event.dates?.start?.localTime || "";
    const cityName = venue?.city?.name || selectedCity;
    const venueName = venue?.name || "Venue TBA";
    const category = event.displayCategory || classification?.segment?.name || "Event";
    const genre = classification?.genre?.name || "";

    return {
      id: event.id,
      name: event.name,
      url: event.url || "#",
      date: eventDate,
      time: eventTime,
      status: event.dates?.status?.code || "",
      category,
      genre,
      image: getBestEventImage(event.images),
      venue: venueName,
      city: cityName,
      country: venue?.country?.name || selectedCountry.name,
      price: price ? `${price.min} - ${price.max} ${price.currency}` : ""
    };
  }

  function renderEvents(events) {
    renderedEventPlans.clear();

    eventsContent.innerHTML = events.map(rawEvent => {
      const event = normalizeTicketmasterEvent(rawEvent);
      const saved = isEventSaved(event);
      const formattedDate = formatEventDate(event.date, event.time);

      const eventPlan = {
        type: "event",
        id: event.id,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        city: event.city,
        name: event.name,
        category: event.category,
        genre: event.genre,
        venue: event.venue,
        date: event.date,
        time: event.time,
        price: event.price,
        url: event.url
      };

      renderedEventPlans.set(event.id, eventPlan);

      return `
        <div class="event-card">
          <div class="event-card-image">
            <img src="${event.image}" alt="${event.name}">
            <span class="event-card-category">${event.category}</span>

            <button
              class="event-card-save ${saved ? "saved" : ""}"
              type="button"
              data-event-id="${event.id}"
            >
              <i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>
          </div>

          <div class="event-card-body">
            <h3>${event.name}</h3>

            <div class="event-card-info">
              <div>
                <i class="fa-regular fa-calendar"></i>
                <span>${formattedDate}</span>
              </div>

              <div>
                <i class="fa-solid fa-location-dot"></i>
                <span>${event.venue}, ${event.city}</span>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn-event" type="button" data-event-id="${event.id}">
                <i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
                Save
              </button>

              <a href="${event.url}" target="_blank" class="btn-buy-ticket">
                <i class="fa-solid fa-ticket"></i>
                Buy Tickets
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bindSaveEventButtons();
  }

  function getBestEventImage(images = []) {
    const image =
      images.find(item => item.ratio === "16_9" && item.width >= 640) ||
      images.find(item => item.width >= 640) ||
      images[0];

    return image?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80";
  }

  function formatEventDate(date, time) {
    if (!date) return "Date TBA";

    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    if (!time) return formattedDate;

    return `${formattedDate} at ${time.slice(0, 5)}`;
  }

  function isEventSaved(event) {
    return savedPlans.some(plan =>
      plan.type === "event" &&
      plan.id === event.id
    );
  }

  function bindSaveEventButtons() {
    document.querySelectorAll("[data-event-id]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();

        const eventId = button.dataset.eventId;
        const eventPlan = renderedEventPlans.get(eventId);

        if (!eventPlan) return;

        const alreadySaved = savedPlans.some(plan =>
          plan.type === "event" &&
          plan.id === eventPlan.id
        );

        if (alreadySaved) {
          showToast("Already saved!", "info");
          return;
        }

        savedPlans.push(eventPlan);
        localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

        document.querySelectorAll(`[data-event-id="${eventId}"]`).forEach(saveButton => {
          saveButton.classList.add("saved");

          const icon = saveButton.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
          }
        });

        showToast("Saved to My Plans!", "success");
      });
    });
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

  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);
  loadEvents();
});

function updateSidebarPlansCount() {
  const badge = document.getElementById("sidebarPlansCount");
  if (!badge) return;

  const savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  const count = savedPlans.length;

  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}