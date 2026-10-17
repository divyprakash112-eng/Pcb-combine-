
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const TIMEZONE = config.timezone || "Asia/Kolkata";
  const START_HOUR = Number(config.startHour ?? 10);
  const END_HOUR = Number(config.endHour ?? 22);

  const grid = document.getElementById("testGrid");
  const searchInput = document.getElementById("testSearch");
  const dialog = document.getElementById("syllabusDialog");
  const syllabusTitle = document.getElementById("syllabusTitle");
  const syllabusBody = document.getElementById("syllabusBody");

  let syllabusData = {};
  let activeFilter = "all";
  let searchQuery = "";
  let fileStatus = new Map();

  const pad = n => String(n).padStart(2, "0");

  function nowParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    return Object.fromEntries(
      parts.filter(p => p.type !== "literal").map(p => [p.type, p.value])
    );
  }

  function todayString(p = nowParts()) {
    return `${p.year}-${p.month}-${p.day}`;
  }

  function minutesNow(p = nowParts()) {
    return Number(p.hour) * 60 + Number(p.minute);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function formatDate(dateString) {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  // Status is determined by schedule, not whether a file was uploaded.
  function scheduleState(test) {
    const now = nowParts();
    const today = todayString(now);

    if (today < test.date) return "upcoming";
    if (today > test.date) return "previous";

    const minutes = minutesNow(now);
    if (minutes < START_HOUR * 60) return "upcoming";
    if (minutes < END_HOUR * 60) return "live";
    return "previous";
  }

  function isUploaded(test) {
    return fileStatus.get(test.id) === true;
  }

  function statusLabel(state) {
    if (state === "live") return "LIVE NOW";
    if (state === "previous") return "PREVIOUS";
    return "UPCOMING";
  }

  function scheduleMessage(test, state) {
    if (state === "live") return "Live now · 10 AM–10 PM IST";

    if (state === "previous") {
      return isUploaded(test)
        ? "Available for practice anytime"
        : "Scheduled date: " + formatDate(test.date);
    }

    return `Goes live on ${formatDate(test.date)} · ${pad(START_HOUR)}:00 AM IST`;
  }

  async function checkCBTFile(test) {
    try {
      const response = await fetch(test.file, {
        method: "HEAD",
        cache: "no-store"
      });

      if (response.ok) return true;

      if (response.status !== 405 && response.status !== 403) {
        return false;
      }
    } catch (_) {
      // Try GET as a fallback.
    }

    try {
      const response = await fetch(test.file, {
        method: "GET",
        cache: "no-store"
      });
      return response.ok;
    } catch (error) {
      console.warn("Could not check CBT file:", test.file, error);
      return false;
    }
  }

  function getSyllabus(id) {
    return syllabusData[String(id)] || null;
  }

  function renderSyllabus(test) {
    const syllabus = getSyllabus(test.id);

    if (!syllabus) {
      return `<p class="syllabus-empty">Syllabus details are not available here yet. Please open the Complete Test Planner.</p>`;
    }

    return Object.entries(syllabus).map(([subject, chapters]) => `
      <section class="syllabus-subject">
        <h3>${escapeHTML(subject)}</h3>
        <ul>
          ${(Array.isArray(chapters) ? chapters : [])
            .map(chapter => `<li>${escapeHTML(chapter)}</li>`).join("")}
        </ul>
      </section>
    `).join("");
  }

  function openSyllabus(test) {
    if (!dialog || !syllabusTitle || !syllabusBody) return;

    syllabusTitle.textContent = `${test.title} — Syllabus`;
    syllabusBody.innerHTML = renderSyllabus(test);

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function matchesSearch(test) {
    if (!searchQuery) return true;

    const syllabus = getSyllabus(test.id);
    const chapters = syllabus ? Object.values(syllabus).flat().join(" ") : "";
    const haystack = [
      test.title,
      `Test ${test.id}`,
      test.type,
      test.date,
      chapters
    ].join(" ").toLowerCase();

    return haystack.includes(searchQuery);
  }

  function matchesFilter(test, state) {
    switch (activeFilter) {
      case "live": return state === "live";
      case "upcoming": return state === "upcoming";
      case "previous": return state === "previous";
      case "part": return test.type === "part";
      case "full": return test.type === "full";
      default: return true;
    }
  }

  function renderTests() {
    if (!grid) return;

    const list = tests.filter(test => {
      const state = scheduleState(test);
      return matchesFilter(test, state) && matchesSearch(test);
    });

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⌕</span>
          <h3>No tests in this filter</h3>
          <p>Try All Tests or choose another filter.</p>
          <button class="btn primary" type="button" data-reset>Show all tests</button>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(test => {
      const state = scheduleState(test);
      const uploaded = isUploaded(test);
      const isPart = test.type === "part";

      let action;

      if (uploaded) {
        const label = state === "live" ? "Start Test ↗" :
          state === "previous" ? "Attempt Test ↗" : "Open CBT ↗";

        action = `
          <a class="btn attempt-btn ${state === "live" ? "is-live" : ""}"
             href="${escapeHTML(test.file)}"
             target="_blank" rel="noopener">${label}</a>`;
      } else {
        action = `
          <button class="btn unavailable-btn" type="button" disabled>
            ${state === "upcoming" ? "Opens on Test Date" : "CBT Coming Soon"}
          </button>`;
      }

      return `
        <article class="test-card state-${state}">
          <div class="card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${state}">${statusLabel(state)}</span>
          </div>

          <h3>${escapeHTML(test.title)}</h3>

          <div class="date-line">
            <span class="date-icon">▦</span>
            <span><strong>Test date</strong> · ${formatDate(test.date)}</span>
          </div>

          <div class="type-pill ${isPart ? "part-pill" : "full-pill"}">
            ${isPart ? "PART SYLLABUS" : "FULL SYLLABUS"}
          </div>

          <p class="schedule-message">${escapeHTML(scheduleMessage(test, state))}</p>

          <div class="test-card-actions">
            <button class="btn syllabus-btn" type="button"
                    data-syllabus="${test.id}">View Syllabus</button>
            ${action}
          </div>
        </article>`;
    }).join("");
  }

  function timestampIST(date, hour) {
    return Date.parse(`${date}T${pad(hour)}:00:00+05:30`);
  }

  function renderCountdown() {
    const title = document.getElementById("nextTitle");
    const date = document.getElementById("nextDate");
    const countdown = document.getElementById("countdown");
    const label = document.getElementById("countLabel");

    if (!title || !date || !countdown) return;

    const now = nowParts();
    const today = todayString(now);
    const currentMinutes = minutesNow(now);

    // If today's test is live, point to the next future test.
    const next = tests.find(test =>
      test.date > today ||
      (test.date === today && currentMinutes < START_HOUR * 60)
    );

    if (!next) {
      title.textContent = "All scheduled tests completed";
      date.textContent = "Previous CBTs remain available when uploaded.";
      countdown.textContent = "—";
      if (label) label.textContent = "NEET AARAMBH";
      return;
    }

    title.textContent = next.title;
    date.textContent = `${formatDate(next.date)} · ${pad(START_HOUR)}:00 AM IST`;

    const remaining = Math.max(0, timestampIST(next.date, START_HOUR) - Date.now());
    const total = Math.floor(remaining / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    countdown.textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    if (label) label.textContent = "Days · Hours · Minutes · Seconds · IST";
  }

  function setActiveFilter(filter) {
    activeFilter = filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderTests();
  }

  function connectEvents() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        setActiveFilter(button.dataset.filter);
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderTests();
      });
    }

    if (grid) {
      grid.addEventListener("click", event => {
        const syllabusButton = event.target.closest("[data-syllabus]");
        if (syllabusButton) {
          const test = getTestById(syllabusButton.dataset.syllabus);
          if (test) openSyllabus(test);
          return;
        }

        if (event.target.closest("[data-reset]")) {
          if (searchInput) searchInput.value = "";
          searchQuery = "";
          setActiveFilter("all");
        }
      });
    }

    const closeButton = document.getElementById("closeDialog");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        if (dialog && typeof dialog.close === "function") dialog.close();
        else if (dialog) dialog.removeAttribute("open");
      });
    }

    if (dialog) {
      dialog.addEventListener("click", event => {
        if (event.target === dialog && typeof dialog.close === "function") {
          dialog.close();
        }
      });
    }
  }

  async function init() {
    if (!Array.isArray(window.tests)) {
      grid.innerHTML = `
        <div class="error-state">
          <h3>Test schedule could not load</h3>
          <p>Please check assets/js/tests.js.</p>
        </div>`;
      return;
    }

    try {
      const response = await fetch("data/syllabus.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      syllabusData = await response.json();
    } catch (error) {
      console.error("Syllabus could not load:", error);
      syllabusData = {};
    }

    connectEvents();

    // Check uploaded files independently; missing files do not affect filters.
    const results = await Promise.all(
      tests.map(async test => [test.id, await checkCBTFile(test)])
    );
    fileStatus = new Map(results);

    renderTests();
    renderCountdown();

    // Refresh status/countdown without rechecking every file.
    setInterval(() => {
      renderTests();
      renderCountdown();
    }, 15000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
