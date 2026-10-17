
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const grid = document.getElementById("testGrid");
  const dialog = document.getElementById("syllabusDialog");
  const syllabusTitle = document.getElementById("syllabusTitle");
  const syllabusBody = document.getElementById("syllabusBody");
  const searchInput = document.getElementById("testSearch");

  let syllabusData = {};
  let activeFilter = "all";
  let searchTerm = "";
  let fileStatus = new Map();

  const pad = n => String(n).padStart(2, "0");

  function indiaParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: config.timezone || "Asia/Kolkata",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    return Object.fromEntries(
      parts.filter(p => p.type !== "literal").map(p => [p.type, p.value])
    );
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function formatDate(value) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
    });
  }

  function timestampIST(date, hour) {
    return Date.parse(`${date}T${pad(hour)}:00:00+05:30`);
  }

  function nowIST() {
    const p = indiaParts();
    return {
      date: `${p.year}-${p.month}-${p.day}`,
      hour: Number(p.hour),
      minute: Number(p.minute),
      second: Number(p.second)
    };
  }

  function currentISTTimestamp() {
    const n = nowIST();
    return Date.parse(`${n.date}T${pad(n.hour)}:${pad(n.minute)}:${pad(n.second)}+05:30`);
  }

  function scheduleStatus(test) {
    const now = currentISTTimestamp();
    const startHour = Number(config.startHour ?? 10);
    const endHour = Number(config.endHour ?? 22);
    const start = timestampIST(test.date, startHour);
    const end = timestampIST(test.date, endHour);

    if (now < start) return "upcoming";
    if (now >= end) return "past";
    return "live";
  }

  async function checkCBTFile(test) {
    try {
      const response = await fetch(test.file, { cache: "no-store" });
      if (!response.ok) return false;
      const contentType = response.headers.get("content-type") || "";
      return contentType.includes("text/html") ||
             contentType.includes("application/octet-stream") ||
             contentType === "";
    } catch (error) {
      console.warn("CBT file check failed:", test.file, error);
      return false;
    }
  }

  function cardStatus(test) {
    const scheduled = scheduleStatus(test);
    const uploaded = fileStatus.get(test.id) === true;

    if (scheduled === "live") return uploaded ? "live" : "missing";
    if (scheduled === "past") return uploaded ? "completed" : "missing";
    return "upcoming";
  }

  function statusLabel(status) {
    return {
      live: "LIVE NOW",
      upcoming: "UPCOMING",
      completed: "COMPLETED",
      missing: "CBT HTML NOT UPLOADED"
    }[status] || "UPCOMING";
  }

  function renderSyllabus(id) {
    const syllabus = syllabusData[String(id)];

    if (!syllabus) {
      return `<p class="empty-state">Syllabus load nahi ho paya. data/syllabus.json check karein.</p>`;
    }

    return Object.entries(syllabus).map(([subject, chapters]) => `
      <section class="syllabus-subject">
        <h3>${escapeHTML(subject)}</h3>
        <ul>${(Array.isArray(chapters) ? chapters : [])
          .map(chapter => `<li>${escapeHTML(chapter)}</li>`).join("")}</ul>
      </section>
    `).join("");
  }

  function openSyllabus(test) {
    syllabusTitle.textContent = `${test.title} — Syllabus`;
    syllabusBody.innerHTML = renderSyllabus(test.id);

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function matchesSearch(test) {
    if (!searchTerm) return true;

    const syllabus = syllabusData[String(test.id)] || {};
    const words = [
      test.title, `test ${test.id}`, test.type,
      ...Object.entries(syllabus).flatMap(([subject, chapters]) => [
        subject, ...(Array.isArray(chapters) ? chapters : [])
      ])
    ];

    return words.join(" ").toLowerCase().includes(searchTerm);
  }

  function matchesFilter(test) {
    const status = cardStatus(test);

    if (activeFilter === "live") return status === "live";
    if (activeFilter === "upcoming") return status === "upcoming" || status === "missing";
    if (activeFilter === "completed") return status === "completed";
    if (activeFilter === "part" || activeFilter === "full") return test.type === activeFilter;

    return true;
  }

  function renderTests() {
    if (!grid) return;

    const list = tests.filter(test => matchesFilter(test) && matchesSearch(test));

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No matching tests</h3><p>Try another filter or search term.</p></div>`;
      return;
    }

    grid.innerHTML = list.map(test => {
      const status = cardStatus(test);
      const canStart = status === "live" && fileStatus.get(test.id) === true;
      const syllabus = syllabusData[String(test.id)] || {};
      const chapters = Object.values(syllabus).flat();
      const preview = chapters.length
        ? chapters.slice(0, 3).join(" · ") + (chapters.length > 3 ? " …" : "")
        : "Complete NEET syllabus";

      return `
        <article class="test-card">
          <div class="test-card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${status}">${statusLabel(status)}</span>
          </div>
          <h3>${escapeHTML(test.title)}</h3>
          <p class="test-date"><strong>Test date:</strong> ${formatDate(test.date)}</p>
          <span class="test-type">${test.type === "full" ? "FULL SYLLABUS" : "PART SYLLABUS"}</span>
          <p class="card-summary">${escapeHTML(preview)}</p>
          <div class="test-card-actions">
            <button class="btn primary" data-action="syllabus" data-id="${test.id}" type="button">View Syllabus</button>
            ${canStart
              ? `<a class="btn test-start" href="${escapeHTML(test.file)}">Start Test ↗</a>`
              : `<button class="btn disabled" type="button" disabled>${
                  status === "missing" ? "CBT Not Uploaded" :
                  status === "completed" ? "Test Ended" : "Not Live Yet"
                }</button>`
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
    if (!title || !date || !countdown) return;

    const now = currentISTTimestamp();
    const startHour = Number(config.startHour ?? 10);
    const endHour = Number(config.endHour ?? 22);

    const next = tests.find(test => timestampIST(test.date, endHour) > now);

    if (!next) {
      title.textContent = "Test series schedule completed";
      date.textContent = "Check the planner for details.";
      countdown.textContent = "—";
      if (label) label.textContent = "NEET AARAMBH";
      return;
    }

    const start = timestampIST(next.date, startHour);
    const end = timestampIST(next.date, endHour);
    const live = now >= start && now < end;
    const target = live ? end : start;
    const remaining = Math.max(0, target - now);
    const total = Math.floor(remaining / 1000);

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    title.textContent = live ? `${next.title} is LIVE` : next.title;
    date.textContent = live
      ? `Test window closes at ${pad(endHour)}:00 IST`
      : `${formatDate(next.date)} · ${pad(startHour)}:00 AM IST`;

    countdown.textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    if (label) {
      label.textContent = live
        ? "Time remaining · Days · Hours · Minutes · Seconds"
        : "Days · Hours · Minutes · Seconds";
    }
  }

  function connectEvents() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll("[data-filter]").forEach(item => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        renderTests();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        renderTests();
      });
    }

    grid.addEventListener("click", event => {
      const button = event.target.closest('[data-action="syllabus"]');
      if (!button) return;

      const test = getTestById(button.dataset.id);
      if (test) openSyllabus(test);
    });

    const closeButton = document.getElementById("closeDialog");
    if (closeButton) {
      closeButton.addEventListener("click", () => dialog.close());
    }

    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }

  async function init() {
    if (!grid) return;

    if (!Array.isArray(tests) || tests.length === 0) {
      grid.innerHTML = `<div class="error-state"><h3>Test schedule unavailable</h3><p>Check assets/js/tests.js.</p></div>`;
      return;
    }

    try {
      const response = await fetch("data/syllabus.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Syllabus returned ${response.status}`);
      syllabusData = await response.json();
    } catch (error) {
      console.error("Could not load data/syllabus.json", error);
      syllabusData = {};
    }

    fileStatus = new Map(tests.map(test => [test.id, false]));
    connectEvents();
    renderTests();
    renderCountdown();

    const results = await Promise.all(
      tests.map(async test => [test.id, await checkCBTFile(test)])
    );

    fileStatus = new Map(results);
    renderTests();
    renderCountdown();

    setInterval(() => {
      renderCountdown();
      renderTests();
    }, 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
