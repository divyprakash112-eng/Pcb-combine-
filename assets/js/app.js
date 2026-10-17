(() => {
  const tests = window.NA_TESTS || [];
  const cfg = window.NA_CONFIG;
  const $ = id => document.getElementById(id);
  let filter = "all";

  const pad = n => String(n).padStart(2, "0");

  function at(date, hour) {
    return new Date(`${date}T${pad(hour)}:00:00+05:30`);
  }
  function start(t) { return at(t.date, cfg.startHour); }
  function end(t) { return at(t.date, cfg.endHour); }

  function status(t, now = new Date()) {
    if (now >= start(t) && now < end(t)) return "live";
    if (now >= end(t)) return "completed";
    return "upcoming";
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      timeZone: "Asia/Kolkata"
    }).format(new Date(date + "T12:00:00+05:30"));
  }

  function title(t) {
    if (t.id === 23) return "Final Full-Syllabus Test";
    return t.type === "full" ? "Full-Syllabus Test" : "Part-Syllabus Test";
  }

  function safe(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;",
      '"':"&quot;", "'":"&#39;"
    }[c]));
  }

  function renderCards() {
    const now = new Date();
    const list = tests.filter(t =>
      filter === "all" || status(t, now) === filter
    );

    $("testGrid").innerHTML = list.map(t => {
      const s = status(t, now);
      const statusText = {
        live: "LIVE NOW",
        upcoming: "UPCOMING",
        completed: "COMPLETED"
      }[s];

      // Actual CBT files use the exact path tests/test-XX.html.
      const link = `tests/test-${pad(t.id)}.html`;
      const canOpen = t.available === true && s !== "upcoming";
      const testButton = canOpen
        ? `<a class="small-btn primary" href="${link}">${
            s === "live" ? "Open Live Test →" : "Open Test / Results →"
          }</a>`
        : `<span class="small-btn disabled">${
            s === "upcoming" ? "Not Live Yet" : "CBT Not Uploaded"
          }</span>`;

      return `
        <article class="test-card">
          <div class="card-top">
            <span class="test-number">TEST ${pad(t.id)}</span>
            <span class="status status-${s}">${statusText}</span>
          </div>
          <h3>${safe(title(t))}</h3>
          <div class="test-date">${dateLabel(t.date)} · 10 AM–10 PM IST</div>
          <span class="test-type">${t.type === "full" ? "FULL SYLLABUS" : "PART SYLLABUS"}</span>
          <p class="card-summary">Physics · Chemistry · Botany · Zoology</p>
          <div class="card-actions">
            <button class="small-btn" data-syllabus="${t.id}">View Syllabus</button>
            ${testButton}
          </div>
        </article>`;
    }).join("") || "<p>No tests in this filter.</p>";

    document.querySelectorAll("[data-syllabus]").forEach(button => {
      button.addEventListener("click", () => {
        openSyllabus(Number(button.dataset.syllabus));
      });
    });
  }

  function openSyllabus(id) {
    const t = tests.find(item => item.id === id);
    if (!t) return;

    $("syllabusTitle").textContent = `Test ${pad(id)} Syllabus`;
    const subjects = ["Physics", "Chemistry", "Botany", "Zoology"];

    $("syllabusBody").innerHTML = subjects.map(subject => {
      const chapters = (t.syllabus && t.syllabus[subject]) || [];
      const list = chapters.length
        ? `<ul>${chapters.map(ch => `<li>${safe(ch)}</li>`).join("")}</ul>`
        : `<p class="muted">Detailed syllabus is not entered here yet. Please check the complete planner PDF.</p>`;

      return `<section class="subject">
        <h3>${subject}</h3>${list}
      </section>`;
    }).join("");

    $("syllabusDialog").showModal();
  }

  function updateCountdown() {
    const now = new Date();
    const next = tests.find(t => now < end(t));

    if (!next) {
      $("nextTitle").textContent = "Test Series Completed";
      $("nextDate").textContent = "All scheduled tests have ended.";
      $("countdown").textContent = "00 : 00 : 00 : 00";
      $("nextButton").href = "#tests";
      return;
    }

    const s = status(next, now);
    const target = s === "live" ? end(next) : start(next);
    const remaining = Math.max(0, target - now);

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    $("nextTitle").textContent =
      `Test ${pad(next.id)} · ${title(next)}`;
    $("nextDate").textContent =
      `${dateLabel(next.date)} · 10:00 AM–10:00 PM IST`;
    $("countdown").textContent =
      `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

    $("countLabel").textContent = s === "live"
      ? "Days · Hours · Minutes · Seconds until test closes"
      : "Days · Hours · Minutes · Seconds until test opens";

    $("nextButton").textContent =
      s === "live" && next.available ? "Open Live Test →" : "View Test Series";

    $("nextButton").href =
      s === "live" && next.available
        ? `tests/test-${pad(next.id)}.html`
        : "#tests";
  }

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(item =>
        item.classList.toggle("active", item === button)
      );
      renderCards();
    });
  });

  $("closeDialog").addEventListener("click", () => {
    $("syllabusDialog").close();
  });

  $("syllabusDialog").addEventListener("click", event => {
    if (event.target === $("syllabusDialog")) {
      $("syllabusDialog").close();
    }
  });

  renderCards();
  updateCountdown();

  // Refresh status when the test starts or ends.
  setInterval(() => {
    updateCountdown();
    renderCards();
  }, 1000);
})();
