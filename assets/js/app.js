
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const TIMEZONE = config.timezone || "Asia/Kolkata";
  const START_HOUR = Number(config.startHour ?? 10);
  const END_HOUR = Number(config.endHour ?? 22);

  const grid = document.getElementById("testGrid");
  const dialog = document.getElementById("syllabusDialog");
  const syllabusTitle = document.getElementById("syllabusTitle");
  const syllabusBody = document.getElementById("syllabusBody");

  let syllabusData = {};
  let activeFilter = "all";
  let searchQuery = "";
  let fileStatus = new Map();

  const pad = value => String(value).padStart(2, "0");

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
      parts.filter(part => part.type !== "literal")
        .map(part => [part.type, part.value])
    );
  }

  function todayString(parts = nowParts()) {
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function currentTimeMinutes(parts = nowParts()) {
    return Number(parts.hour) * 60 + Number(parts.minute);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
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

  function scheduleState(test) {
    const now = nowParts();
    const today = todayString(now);

    if (today < test.date) return "upcoming";
    if (today > test.date) return "previous";

    const minutes = currentTimeMinutes(now);

    if (minutes < START_HOUR * 60) return "upcoming";
    if (minutes < END_HOUR * 60) return "live";

    return "previous";
  }

  function cardState(test) {
    const schedule = scheduleState(test);
    const uploaded = fileStatus.get(test.id) === true;

    if (!uploaded) return "missing";
    return schedule;
  }

  function statusLabel(status, test) {
    if (status === "missing") return "CBT NOT UPLOADED";
    if (status === "live") return "LIVE NOW";
    if (status === "previous") return "PREVIOUS";
    if (status === "upcoming" && scheduleState(test) === "upcoming") {
      const now = nowParts();

      if (todayString(now) === test.date) {
        return `STARTS AT ${pad(START_HOUR)}:00 AM`;
      }
    }

    return "UPCOMING";
  }

  async function checkCBTFile(test) {
    const path = test.file;

    try {
      const head = await fetch(path, {
        method: "HEAD",
        cache: "no-store"
      });

      if (head.ok) return true;

      // Some static hosts may not handle HEAD requests correctly.
      if (head.status !== 405 && head.status !== 403) return false;
    } catch (_) {
      // Try a normal GET request below.
    }

    try {
      const response = await fetch(path, {
        method: "GET",
        cache: "no-store"
      });

      return response.ok;
    } catch (error) {
      console.warn("Could not verify CBT file:", path, error);
      return false;
    }
  }

  function getSyllabus(testId) {
    return syllabusData[String(testId)] || null;
  }

  function renderSyllabus(testId) {
    const syllabus = getSyllabus(testId);

    if (!syllabus) {
      return `
        <p>Syllabus details are not available yet.
        Please check the Complete Test Planner.</p>
      `;
    }

    return Object.entries(syllabus).map(([subject, chapters]) => `
      <section class="syllabus-subject">
        <h3>${escapeHTML(subject)}</h3>
        <ul>
          ${(Array.isArray(chapters) ? chapters : [])
            .map(chapter => `<li>${escapeHTML(chapter)}</li>`)
            .join("")}
        </ul>
      </section>
    `).join("");
  }

  function openSyllabus(test) {
    if (!dialog || !syllabusTitle || !syllabusBody) return;

    syllabusTitle.textContent = `${test.title} — Syllabus`;
    syllabusBody.innerHTML = renderSyllabus(test.id);

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function matchesSearch(test) {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const syllabus = getSyllabus(test.id);
    const chapterText = syllabus
      ? Object.values(syllabus).flat().join(" ")
      : "";

    return [
      test.title,
      `test ${test.id}`,
      test.type,
      test.date,
      chapterText
    ].join(" ").toLowerCase().includes(query);
  }

  function matchesFilter(test, status) {
    if (activeFilter === "all") return true;
    if (activeFilter === "live") return status === "live";
    if (activeFilter === "upcoming") return status === "upcoming";
    if (activeFilter === "previous" || activeFilter === "completed") {
      return status === "previous";
    }
    if (activeFilter === "part") return test.type !== "full";
    if (activeFilter === "full") return test.type === "full";

    return true;
  }

  function renderTests() {
    if (!grid) return;

    const filtered = tests.filter(test => {
      const status = cardState(test);
      return matchesFilter(test, status) && matchesSearch(test);
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No tests found</h3>
          <p>Try another search or choose a different filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(test => {
      const status = cardState(test);
      const uploaded = fileStatus.get(test.id) === true;
      const canAttempt = uploaded;
      const isFull = test.type === "full";
      const syllabus = getSyllabus(test.id);
      const preview = syllabus
        ? Object.values(syllabus).flat().slice(0, 4).join(" · ")
        : "Open syllabus to view chapter details";

      const attemptLabel = status === "live"
        ? "Start Test ↗"
        : status === "previous"
          ? "Attempt Test ↗"
          : "Not Live Yet";

      return `
        <article class="test-card">
          <div class="test-card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${status}">
              ${statusLabel(status, test)}
            </span>
          </div>

          <h3>${escapeHTML(test.title)}</h3>

          <p class="test-date">
            <strong>Test date:</strong> ${formatDate(test.date)}
          </p>

          <p class="test-type">
            ${isFull ? "Full Syllabus" : "Part Syllabus"}
          </p>

          <p class="test-preview">${escapeHTML(preview)}</p>

          <div class="test-card-actions">
            <button class="btn primary"
              type="button"
              data-action="syllabus"
              data-id="${test.id}">
              View Syllabus
            </button>

            ${
              canAttempt
                ? `<a class="btn white"
                     href="${escapeHTML(test.file)}"
                     target="_blank"
                     rel="noopener">
                     ${attemptLabel}
                   </a>`
                : `<button class="btn disabled"
                     type="button"
                     disabled>
                     ${status === "missing"
                       ? "CBT Not Uploaded"
                       : "Not Live Yet"}
                   </button>`
            }
          </div>
        </article>
      `;
    }).join("");
  }

  function timestampForIndia(date, hour) {
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
    const nowMinutes = currentTimeMinutes(now);

    // While a test is live, count down to the next scheduled test.
    const next = tests.find(test => {
      if (test.date > today) return true;
      if (test.date < today) return false;
      return nowMinutes < START_HOUR * 60;
    });

    if (!next) {
      title.textContent = "All scheduled tests have started";
      date.textContent = "Previous tests remain available below.";
      countdown.textContent = "—";
      if (label) label.textContent = "NEET AARAMBH";
      return;
    }

    title.textContent = next.title;
    date.textContent = formatDate(next.date);

    const target = timestampForIndia(next.date, START_HOUR);
    const remaining = Math.max(0, target - Date.now());
    const secondsTotal = Math.floor(remaining / 1000);

    const days = Math.floor(secondsTotal / 86400);
    const hours = Math.floor((secondsTotal % 86400) / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const seconds = secondsTotal % 60;

    countdown.textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    if (label) {
      label.textContent = "Days · Hours · Minutes · Seconds · IST";
    }
  }

  function connectEvents() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      // Rename the old Completed filter to Previous.
      if (
        button.dataset.filter === "completed" ||
        button.dataset.filter === "previous"
      ) {
        button.textContent = "Previous";
        button.dataset.filter = "previous";
      }

      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(item => {
          item.classList.toggle("active", item === button);
        });

        renderTests();
      });
    });

    const searchInput =
      document.getElementById("searchInput") ||
      document.getElementById("searchTests") ||
      document.querySelector('input[type="search"]') ||
      document.querySelector('input[placeholder*="Search"]');

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim();
        renderTests();
      });
    }

    if (grid) {
      grid.addEventListener("click", event => {
        const button = event.target.closest('[data-action="syllabus"]');
        if (!button) return;

        const test = getTestById(button.dataset.id);
        if (test) openSyllabus(test);
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
    if (typeof tests === "undefined" || !Array.isArray(tests)) {
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>Test schedule unavailable</h3>
            <p>Please check assets/js/tests.js.</p>
          </div>
        `;
      }
      return;
    }

    try {
      const response = await fetch("./data/syllabus.json", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Syllabus request failed: ${response.status}`);
      }

      syllabusData = await response.json();
    } catch (error) {
      console.error("Could not load syllabus:", error);
      syllabusData = {};
    }

    connectEvents();

    // Check each file independently so one missing test won't block others.
    const checks = await Promise.all(
      tests.map(async test => [test.id, await checkCBTFile(test)])
    );

    fileStatus = new Map(checks);

    renderTests();
    renderCountdown();

    // Keep status/countdown current without repeatedly checking all files.
    setInterval(() => {
      renderTests();
      renderCountdown();
    }, 15000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
