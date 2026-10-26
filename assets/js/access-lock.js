
(() => {
  "use strict";

  const ACCESS_PASSWORD = "Aarambh@2027";
  const ACCESS_KEY = "na_pcb_access_unlocked_v1";

  try {
    if (sessionStorage.getItem(ACCESS_KEY) === "yes") return;
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    body > *:not(#na-access-overlay) {
      visibility: hidden !important;
    }

    #na-access-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: grid;
      place-items: center;
      padding: 20px;
      background: #07152e;
      color: white;
      font-family: Arial, sans-serif;
    }

    .na-lock-card {
      width: min(100%, 380px);
      padding: 28px;
      border-radius: 18px;
      background: #10264a;
      text-align: center;
      box-sizing: border-box;
    }

    .na-lock-card input,
    .na-lock-card button {
      width: 100%;
      padding: 14px;
      margin-top: 12px;
      border-radius: 9px;
      box-sizing: border-box;
      font-size: 16px;
    }

    .na-lock-card input {
      background: #07152e;
      color: white;
      border: 1px solid #5475a8;
    }

    .na-lock-card button {
      border: 0;
      background: #2875ed;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    #na-lock-error {
      color: #ffaaaa;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  function showLock() {
    const overlay = document.createElement("div");
    overlay.id = "na-access-overlay";

    overlay.innerHTML = `
      <div class="na-lock-card">
        <h2>NEET AARAMBH</h2>
        <p>PCB Combined Test Series</p>
        <p>Enter your access password to continue.</p>

        <form id="na-lock-form">
          <input id="na-lock-password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            required>
          <button type="submit">Unlock Test Series</button>
          <p id="na-lock-error" role="alert"></p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("na-lock-form")
      .addEventListener("submit", function(event) {
        event.preventDefault();

        const entered =
          document.getElementById("na-lock-password").value;

        if (entered === ACCESS_PASSWORD) {
          try {
            sessionStorage.setItem(ACCESS_KEY, "yes");
          } catch (_) {}

          overlay.remove();

          document.querySelectorAll("body > *")
            .forEach(element => {
              element.style.visibility = "";
            });
        } else {
          document.getElementById("na-lock-error")
            .textContent = "Incorrect password. Try again.";
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showLock);
  } else {
    showLock();
  }
})();
