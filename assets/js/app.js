let syllabusData = {};

async function loadSyllabusData() {
  try {
    const response = await fetch("./data/syllabus.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Syllabus load failed: ${response.status}`);
    }

    syllabusData = await response.json();
    return syllabusData;
  } catch (error) {
    console.error("Unable to load syllabus:", error);
    syllabusData = {};
    return syllabusData;
  }
}

function renderSyllabus(testId) {
  const syllabus = syllabusData[String(testId)];

  if (!syllabus) {
    return "<p>Syllabus abhi available nahi hai.</p>";
  }

  return Object.entries(syllabus).map(([subject, chapters]) => `
    <section class="syllabus-subject">
      <h3>${escapeHTML(subject)}</h3>
      <ul>
        ${chapters.map(chapter =>
          `<li>${escapeHTML(chapter)}</li>`
        ).join("")}
      </ul>
    </section>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

document.addEventListener("DOMContentLoaded", loadSyllabusData);
