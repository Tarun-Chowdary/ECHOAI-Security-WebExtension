// content.js — injected into every page

(function () {
  // Prevent duplicate overlays
  if (document.getElementById("__phishine_overlay__")) return;

  function showWarning(data) {
    const confidence = Math.round((data.confidence || 0) * 100);

    const overlay = document.createElement("div");
    overlay.id = "__phishine_overlay__";

    overlay.innerHTML = `
      <style>
        #__phishine_overlay__ {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          background: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          backdrop-filter: blur(6px);
          animation: phi-fadein 0.3s ease;
        }
        @keyframes phi-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        #__phi_card__ {
          background: #0f172a;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 16px;
          padding: 32px 28px 24px;
          max-width: 380px;
          width: calc(100% - 40px);
          text-align: center;
          box-shadow: 0 0 60px rgba(239,68,68,0.2);
          animation: phi-slidein 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes phi-slidein {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        #__phi_card__ .phi-icon {
          width: 60px; height: 60px;
          background: rgba(239,68,68,0.12);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          font-size: 26px;
        }
        #__phi_card__ h1 {
          color: #f87171;
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }
        #__phi_card__ .phi-sub {
          color: #64748b;
          font-size: 13px;
          margin: 0 0 18px;
          line-height: 1.5;
        }
        #__phi_card__ .phi-conf {
          display: inline-block;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 20px;
          margin-bottom: 24px;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
        #__phi_card__ .phi-url {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: #475569;
          word-break: break-all;
          margin-bottom: 24px;
          text-align: left;
          font-family: 'Courier New', monospace;
        }
        #__phi_card__ .phi-btns {
          display: flex;
          gap: 10px;
        }
        #__phi_card__ button {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-family: inherit;
        }
        #__phi_card__ button:active { transform: scale(0.97); }
        #__phi_card__ #phi-leave {
          background: #ef4444;
          color: white;
        }
        #__phi_card__ #phi-leave:hover { opacity: 0.88; }
        #__phi_card__ #phi-proceed {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #64748b;
        }
        #__phi_card__ #phi-proceed:hover { background: rgba(255,255,255,0.1); color: #94a3b8; }
      </style>

      <div id="__phi_card__">
        <div class="phi-icon">⚠</div>
        <h1>Phishing Warning</h1>
        <p class="phi-sub">This site has been flagged as a potential phishing attempt by Phishine AI. Proceeding may put your data at risk.</p>
        <div class="phi-conf">Confidence: ${confidence}%</div>
        <div class="phi-url">${location.href.substring(0, 120)}${location.href.length > 120 ? "…" : ""}</div>
        <div class="phi-btns">
          <button id="phi-leave">Leave Site</button>
          <button id="phi-proceed">Proceed Anyway</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("phi-leave").onclick = () => {
      window.location.href = "https://google.com";
    };

    document.getElementById("phi-proceed").onclick = () => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.2s ease";
      setTimeout(() => overlay.remove(), 200);
    };

    // Escape key dismisses
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    });
  }

  chrome.runtime.onMessage.addListener((data) => {
    if (data.action === "BLOCK") {
      showWarning(data);
    }
  });
})();
