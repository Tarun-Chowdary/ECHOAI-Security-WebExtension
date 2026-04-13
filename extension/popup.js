// ─── State ────────────────────────────────────────────────
const BACKEND = "http://127.0.0.1:8000/predict";
let isScanning = false;

// ─── DOM refs ─────────────────────────────────────────────
const urlInput = document.getElementById("urlInput");
const clearBtn = document.getElementById("clearBtn");
const checkBtn = document.getElementById("checkBtn");
const btnText = document.getElementById("btnText");
const scanLoader = document.getElementById("scanLoader");
const statusDot = document.getElementById("statusDot");

const stateIdle = document.getElementById("stateIdle");
const stateLoading = document.getElementById("stateLoading");
const stateResult = document.getElementById("stateResult");
const stateError = document.getElementById("stateError");

// ─── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Auto-fill current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url && !tabs[0].url.startsWith("chrome://")) {
      urlInput.value = tabs[0].url;
      toggleClearBtn();
    }
  });

  checkBtn.addEventListener("click", handleScan);
  clearBtn.addEventListener("click", clearInput);

  urlInput.addEventListener("input", toggleClearBtn);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleScan();
  });
});

// ─── Helpers ──────────────────────────────────────────────
function toggleClearBtn() {
  clearBtn.classList.toggle("visible", urlInput.value.length > 0);
}

function clearInput() {
  urlInput.value = "";
  toggleClearBtn();
  showState("idle");
  setStatusDot("idle");
  urlInput.focus();
}

function setStatusDot(state) {
  statusDot.className = "status-dot";
  if (state !== "idle") statusDot.classList.add(state);
}

function showState(state) {
  stateIdle.classList.add("hidden");
  stateLoading.classList.add("hidden");
  stateResult.classList.add("hidden");
  stateError.classList.add("hidden");

  if (state === "idle") stateIdle.classList.remove("hidden");
  if (state === "loading") stateLoading.classList.remove("hidden");
  if (state === "result") stateResult.classList.remove("hidden");
  if (state === "error") stateError.classList.remove("hidden");
}

function setScanning(active) {
  isScanning = active;
  checkBtn.disabled = active;
  scanLoader.classList.toggle("active", active);
  btnText.textContent = active ? "Scanning…" : "Scan URL";
}

// ─── Validate URL ──────────────────────────────────────────
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Main scan handler ─────────────────────────────────────
async function handleScan() {
  if (isScanning) return;

  const raw = urlInput.value.trim();
  if (!raw) {
    urlInput.focus();
    return;
  }

  // Try prefixing https:// if missing scheme
  const url =
    raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : "https://" + raw;

  if (!isValidUrl(url)) {
    showError("Invalid URL", "Enter a valid URL like https://example.com");
    setStatusDot("error");
    return;
  }

  // Update input with normalized URL
  urlInput.value = url;

  setScanning(true);
  setStatusDot("scanning");
  showState("loading");

  try {
    const response = await fetch(BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    renderResult(data);

    // Send BLOCK message to content script if needed
    if (data.action === "BLOCK") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, data, () => {
            // Ignore errors if content script isn't injected on that tab
            if (chrome.runtime.lastError) {
            }
          });
        }
      });
    }
  } catch (err) {
    console.error("[Phishine]", err);
    showError(
      "Backend unreachable",
      "Make sure the backend is running on port 8000",
    );
    setStatusDot("error");
  } finally {
    setScanning(false);
  }
}

// ─── Render result ─────────────────────────────────────────
function renderResult(data) {
  const isSafe = data.prediction === "safe";
  const confidence = Math.round((data.confidence || 0) * 100);
  const risk = (data.risk || "low").toLowerCase();

  // Verdict
  const verdict = document.getElementById("verdict");
  const verdictIcon = document.getElementById("verdictIcon");
  const verdictLabel = document.getElementById("verdictLabel");
  const verdictSub = document.getElementById("verdictSublabel");
  const confBadge = document.getElementById("confidenceBadge");

  verdict.className = `verdict ${isSafe ? "safe" : "danger"}`;
  verdictIcon.textContent = isSafe ? "✓" : "✕";
  verdictLabel.textContent = isSafe ? "SAFE" : "PHISHING";
  verdictSub.textContent = isSafe
    ? "No threats detected"
    : "Potential phishing site detected";
  confBadge.textContent = `${confidence}%`;

  // Gauge
  const gaugeFill = document.getElementById("gaugeFill");
  gaugeFill.className = `gauge-fill ${isSafe ? "safe" : "danger"}`;
  // For safe: fill = confidence from left (low = small bar = safer feel)
  // For phishing: fill = confidence (high = large bar = danger)
  setTimeout(() => {
    gaugeFill.style.width = `${confidence}%`;
  }, 50);

  // Risk pill
  const riskPill = document.getElementById("riskPill");
  riskPill.textContent = risk.charAt(0).toUpperCase() + risk.slice(1);
  riskPill.className = `risk-pill ${risk}`;

  // Reasons
  const reasonsList = document.getElementById("reasonsList");
  reasonsList.innerHTML = "";
  reasonsList.className = `reasons-list ${isSafe ? "safe" : "danger"}`;
  const reasons = data.reasons || [];
  if (reasons.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No specific signals detected.";
    reasonsList.appendChild(li);
  } else {
    reasons.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = r;
      reasonsList.appendChild(li);
    });
  }

  // Action buttons
  const actionRow = document.getElementById("actionRow");
  actionRow.innerHTML = "";

  if (!isSafe) {
    const leaveBtn = document.createElement("button");
    leaveBtn.className = "action-btn danger-btn";
    leaveBtn.textContent = "Leave Site";
    leaveBtn.onclick = () => {
      window.location.href = "https://google.com";
    };
    actionRow.appendChild(leaveBtn);
  }

  const copyBtn = document.createElement("button");
  copyBtn.className = "action-btn";
  copyBtn.textContent = "Copy URL";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(urlInput.value).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy URL";
      }, 1500);
    });
  };
  actionRow.appendChild(copyBtn);

  showState("result");
  setStatusDot(isSafe ? "safe" : "danger");
}

// ─── Show error ────────────────────────────────────────────
function showError(title, sub) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorSub").textContent = sub;
  showState("error");
}
