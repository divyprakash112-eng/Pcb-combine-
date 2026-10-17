
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

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

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
      parts
        .filter(part => part.type !== "literal")
        .map(part => [part.type, part.value])
    );
  }

  function todayString(parts = nowParts()) {
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function minutesNow(parts = nowParts()) {
    return Number(parts.hour) * 60 + Number(parts.minute);
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(Date.UTC(year, month - 1, day))
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      });
  }

  // Schedule status is independent of whether the CBT file exists.
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
    return fileStatus.get(String(test.id)) === true;
  }

  function statusLabel(state) {
    if (state === "live") return "LIVE NOW";
    if (state === "previous") return "PREVIOUS";
    return "UPCOMING";
  }

  function scheduleMessage(test, state) {
    if (state === "live") {
      return "Live now · 10 AM–10 PM IST";
    }

    if (state === "upcoming") {
      return `Goes live on ${formatDate(test.date)} · 10 AM–10 PM IST`;
    }

    return isUploaded(test)
      ? "Available for practice anytime"
      : `Scheduled date: ${formatDate(test.date)}`;
  }

  // Check whether the expected standalone CBT HTML file exists.
  async function checkCBTFile(test) {
    try {
      const response = await fetch(test.file, {
        method: "HEAD",
        cache: "no-store"
      });

      if (response.ok) return true;

      if (response.status !== 403 && response.status !== 405) {
        return false;
      }
    } catch (_) {
      // Try GET below if HEAD is unsupported.
    }

    try {
      const response = await fetch(test.file, {
        method: "GET",
        cache: "no-store"
      });

      return response.ok;
    } catch (error) {
      console.warn("CBT file check failed:", test.file, error);
      return false;
    }
  }

  function getSyllabus(id) {
    return syllabusData[String(id)] || null;
  }

  function openSyllabus(test) {
    if (!dialog || !syllabusTitle || !syllabusBody) return;

    const syllabus = getSyllabus(test.id);

    syllabusTitle.textContent = `${test.title} — Syllabus`;

    if (!syllabus) {
      syllabusBody.innerHTML = `
        <p class="syllabus-empty">
          Syllabus details are not available. Please check the Complete Test Planner.
        </p>`;
    } else {
      syllabusBody.innerHTML = Object.entries(syllabus)
        .map(([subject, chapters]) => `
          <section class="syllabus-subject">
            <h3>${escapeHTML(subject)}</h3>
            <ul>
              ${(Array.isArray(chapters) ? chapters : [])
                .map(chapter => `<li>${escapeHTML(chapter)}</li>`)
                .join("")}
            </ul>
          </section>
        `)
        .join("");
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function matchesSearch(test) {
    if (!searchQuery) return true;

    const syllabus = getSyllabus(test.id);
    const chapters = syllabus
      ? Object.values(syllabus).flat().join(" ")
      : "";

    const searchableText = [
      test.title,
      `Test ${test.id}`,
      test.type,
      test.date,
      chapters
    ].join(" ").toLowerCase();

    return searchableText.includes(searchQuery);
  }

  function matchesFilter(test, state) {
    switch (activeFilter) {
      case "live":
        return state === "live";
      case "upcoming":
        return state === "upcoming";
      case "previous":
        return state === "previous";
      case "part":
        return test.type === "part";
      case "full":
        return test.type === "full";
      default:
        return true;
    }
  }

  function renderTests() {
    if (!grid) return;

    const list = tests.filter(test => {
      const state = scheduleState(test);
      return matchesFilter(test, state) && matchesSearch(test);
    });

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⌕</span>
          <h3>No tests found</h3>
          <p>Try another filter or search term.</p>
          <button class="btn primary" type="button" data-reset>
            Show All Tests
          </button>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(test => {
      const state = scheduleState(test);
      const uploaded = isUploaded(test);
      const isPart = test.type === "part";

      // Upcoming tests never open before their scheduled live window.
      let action;

      if (uploaded && state !== "upcoming") {
        const label = state === "live"
          ? "Start Test ↗"
          : "Attempt Test ↗";

        action = `
          <a class="btn attempt-btn ${state === "live" ? "is-live" : ""}"
             href="${escapeHTML(test.file)}"
             target="_blank"
             rel="noopener">${label}</a>`;
      } else {
        const label = state === "upcoming"
          ? "Opens on Test Date"
          : "CBT Coming Soon";

        action = `
          <button class="btn unavailable-btn" type="button" disabled>
            ${label}
          </button>`;
      }

      return `
        <article class="test-card state-${state}">
          <div class="card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${state}">
              ${statusLabel(state)}
            </span>
          </div>

          <h3>${escapeHTML(test.title)}</h3>

          <div class="date-line">
            <span class="date-icon">▦</span>
            <span>
              <strong>Test date:</strong> ${formatDate(test.date)}
            </span>
          </div>

          <div class="type-pill ${isPart ? "part-pill" : "full-pill"}">
            ${isPart ? "PART SYLLABUS" : "FULL SYLLABUS"}
          </div>

          <p class="schedule-message">
            ${escapeHTML(scheduleMessage(test, state))}
          </p>

          <div class="test-card-actions">
            <button class="btn syllabus-btn"
                    type="button"
                    data-syllabus="${escapeHTML(test.id)}">
              View Syllabus
            </button>
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
    const minutes = minutesNow(now);

    const next = tests.find(test =>
      test.date > today ||
      (test.date === today && minutes < START_HOUR * 60)
    );

    if (!next) {
      title.textContent = "All scheduled tests completed";
      date.textContent = "Uploaded CBTs may still be available for practice.";
      countdown.textContent = "—";

      if (label) label.textContent = "NEET AARAMBH";
      return;
    }

    title.textContent = next.title;
    date.textContent =
      `${formatDate(next.date)} · ${pad(START_HOUR)}:00 AM IST`;

    const remaining = Math.max(
      0,
      timestampIST(next.date, START_HOUR) - Date.now()
    );

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdown.textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(mins)} : ${pad(seconds)}`;

    if (label) {
      label.textContent = "Days · Hours · Minutes · Seconds · IST";
    }
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
        if (dialog && typeof dialog.close === "function") {
          dialog.close();
        } else if (dialog) {
          dialog.removeAttribute("open");
        }
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
    // tests.js defines the shared tests array and getTestById helper.
    if (typeof tests === "undefined" || !Array.isArray(tests)) {
      if (grid) {
        grid.innerHTML = `
          <div class="error-state">
            <h3>Test schedule could not load</h3>
            <p>Please check that assets/js/tests.js is present and loaded.</p>
          </div>`;
      }
      return;
    }

    try {
      const response = await fetch("data/syllabus.json", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Syllabus request failed: ${response.status}`);
      }

      syllabusData = await response.json();
    } catch (error) {
      console.error("Syllabus could not load:", error);
      syllabusData = {};
    }

    connectEvents();

    // Missing CBT files do not hide scheduled upcoming tests.
    const results = await Promise.all(
      tests.map(async test => [
        String(test.id),
        await checkCBTFile(test)
      ])
    );

    fileStatus = new Map(results);

    renderTests();
    renderCountdown();

    // Refresh the schedule display automatically.
    setInterval(() => {
      renderTests();
      renderCountdown();
    }, 15000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
