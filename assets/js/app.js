
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const grid = document.getElementById("testGrid");
  const dialog = document.getElementById("syllabusDialog");
  const syllabusTitle = document.getElementById("syllabusTitle");
  const syllabusBody = document.getElementById("syllabusBody");

  let syllabusData = {};
  let activeFilter = "all";
  let fileStatus = new Map();

  const pad = n => String(n).padStart(2, "0");

  function indiaNowParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: config.timezone || "Asia/Kolkata",
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

  function indiaToday() {
    const p = indiaNowParts();
    return `${p.year}-${p.month}-${p.day}`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      }
    );
  }

  function getScheduleState(test) {
    const now = indiaNowParts();
    const today = `${now.year}-${now.month}-${now.day}`;
    const hour = Number(now.hour);
    const startHour = Number(config.startHour ?? 10);
    const endHour = Number(config.endHour ?? 22);

    if (today < test.date) return "upcoming";
    if (today > test.date) return "past";

    if (hour < startHour) return "today-upcoming";
    if (hour >= endHour) return "past";
    return "live";
  }

  async function checkCBTFile(test) {
    try {
      const response = await fetch(test.file, {
        method: "HEAD",
        cache: "no-store"
      });

      return response.ok;
    } catch (error) {
      console.warn(`Could not verify ${test.file}`, error);
      return false;
    }
  }

  function getCardStatus(test) {
    const schedule = getScheduleState(test);
    const uploaded = fileStatus.get(test.id) === true;

    if (schedule === "live") {
      return uploaded ? "live" : "missing";
    }

    if (schedule === "past") {
      return uploaded ? "completed" : "missing";
    }

    return "upcoming";
  }

  function statusLabel(status) {
    return {
      live: "LIVE NOW",
      upcoming: "UPCOMING",
      "today-upcoming": "STARTS AT 10 AM",
      completed: "COMPLETED",
      missing: "CBT HTML NOT UPLOADED"
    }[status] || "UPCOMING";
  }

  function renderSyllabus(testId) {
    const syllabus = syllabusData[String(testId)];

    if (!syllabus) {
      return "<p>Syllabus abhi available nahi hai. Complete planner check karein.</p>";
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

  function renderTests() {
    if (!grid) return;

    const filtered = tests.filter(test => {
      const status = getCardStatus(test);

      if (activeFilter === "all") return true;
      if (activeFilter === "live") return status === "live";
      if (activeFilter === "upcoming") {
        return status === "upcoming" || status === "missing";
      }
      if (activeFilter === "completed") return status === "completed";

      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No tests in this section</h3>
          <p>Is category mein abhi koi test nahi hai.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(test => {
      const status = getCardStatus(test);
      const isLive = status === "live";
      const canOpen = isLive && fileStatus.get(test.id) === true;

      return `
        <article class="test-card">
          <div class="test-card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${status}">
              ${statusLabel(status)}
            </span>
          </div>

          <h3>${escapeHTML(test.title)}</h3>

          <p class="test-date">
            <strong>Test date:</strong> ${formatDate(test.date)}
          </p>

          <p class="test-type">
            ${test.type === "full" ? "Full Syllabus" : "Part Syllabus"}
          </p>

          <div class="test-card-actions">
            <button
              class="btn primary"
              type="button"
              data-action="syllabus"
              data-id="${test.id}">
              View Syllabus
            </button>

            ${
              canOpen
                ? `<a class="btn white" href="${escapeHTML(test.file)}">
                     Start Test ↗
                   </a>`
                : `<button class="btn disabled" type="button" disabled>
                     ${status === "missing" ? "CBT Not Uploaded" :
                       status === "completed" ? "Test Ended" :
                       "Not Live Yet"}
                   </button>`
            }
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCountdown() {
    const title = document.getElementById("nextTitle");
    const date = document.getElementById("nextDate");
    const countdown = document.getElementById("countdown");
    const label = document.getElementById("countLabel");
    const button = document.getElementById("nextButton");

    if (!title || !date || !countdown) return;

    const today = indiaToday();
    const next = tests.find(test => test.date >= today);

    if (!next) {
      title.textContent = "All scheduled tests have passed";
      date.textContent = "Check the complete planner";
      countdown.textContent = "—";
      if (label) label.textContent = "NEET AARAMBH";
      if (button) button.href = "#tests";
      return;
    }

    title.textContent = next.title;
    date.textContent = formatDate(next.date);

    const now = indiaNowParts();
    const target = Date.parse(
      `${next.date}T${pad(Number(config.startHour ?? 10))}:00:00+05:30`
    );

    const current = Date.parse(
      `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}:${now.second}+05:30`
    );

    const remaining = Math.max(0, target - current);
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdown.textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    if (label) {
      label.textContent = "Days · Hours · Minutes · Seconds";
    }

    if (button) button.href = "#tests";
  }

  function connectEvents() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(item => {
          item.classList.toggle("active", item === button);
        });

        renderTests();
      });
    });

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
        if (event.target === dialog) dialog.close();
      });
    }
  }

  async function init() {
    if (!Array.isArray(window.tests) && typeof tests === "undefined") {
      if (grid) {
        grid.innerHTML = `
          <p>Test schedule load nahi hua. assets/js/tests.js check karein.</p>
        `;
      }
      if (document.getElementById("nextTitle")) {
        document.getElementById("nextTitle").textContent = "Schedule unavailable";
      }
      return;
    }

    if (grid) grid.innerHTML = "<p>Loading tests…</p>";

    try {
      const response = await fetch("./data/syllabus.json", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Syllabus request failed: ${response.status}`);
      }

      syllabusData = await response.json();
    } catch (error) {
      console.error("Syllabus JSON error:", error);
      syllabusData = {};
    }

    connectEvents();

    const checks = await Promise.all(
      tests.map(async test => [test.id, await checkCBTFile(test)])
    );

    fileStatus = new Map(checks);

    renderTests();
    renderCountdown();

    // Update countdown and status on the live page.
    setInterval(() => {
      renderCountdown();
      renderTests();
    }, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
