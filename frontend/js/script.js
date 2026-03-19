/* ============================================================
   INSTAFETCH — Core Logic (DEPLOY READY)
   ============================================================ */

// ❌ OLD: const API_BASE = "http://localhost:3000";
// ✅ NEW: empty (same server pe chalega)
const API_BASE = "";

/* ---- DOM ---- */
const inputField   = document.getElementById("insta-link");
const btnFetch     = document.getElementById("btn-fetch");
const statusMsg    = document.getElementById("status-msg");
const previewWrap  = document.getElementById("preview");
const previewVideo = document.getElementById("preview-video");
const previewImage = document.getElementById("preview-image");
const btnSave      = document.getElementById("btn-save");

/* ---- Fetch Media ---- */
async function fetchMedia() {
  const url = inputField.value.trim();

  if (!url) {
    showStatus("Paste an Instagram URL to get started.", "error");
    shakeRow();
    return;
  }

  hidePreview();
  showStatus("", "");
  setLoading(true);

  try {
    const res = await fetch(`/download`, {   // ✅ FIXED
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!data.success) {
      showStatus(data.message || "Could not fetch media.", "error");
      setLoading(false);
      return;
    }

    // ✅ FIXED PROXY URL
    const proxyUrl = `/proxy?url=${encodeURIComponent(data.url)}`;

    if (data.type === "video") {
      previewVideo.src = proxyUrl;
      previewVideo.style.display = "block";
      previewImage.style.display = "none";
    } else {
      previewImage.src = proxyUrl;
      previewImage.style.display = "block";
      previewVideo.style.display = "none";
    }

    btnSave.onclick = () => downloadBlob(proxyUrl, data.type);

    showPreview();
    showStatus("Ready — preview below ↓", "success");

  } catch (err) {
    console.error(err);
    showStatus("Server error — try again.", "error");
  } finally {
    setLoading(false);
  }
}

/* ---- Download Blob ---- */
async function downloadBlob(proxyUrl, type) {
  const originalHTML = btnSave.innerHTML;

  try {
    btnSave.textContent = "Preparing…";

    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const ext = type === "video" ? "mp4" : "jpg";

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `instafetch_${Date.now()}.${ext}`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);

    btnSave.innerHTML = originalHTML;

  } catch {
    showStatus("Download failed — try again.", "error");
    btnSave.innerHTML = originalHTML;
  }
}

/* ---- Helpers ---- */
function setLoading(on) {
  btnFetch.classList.toggle("loading", on);
  btnFetch.disabled = on;
}

function showStatus(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = "status-msg" + (type ? ` ${type}` : "");
}

function showPreview() {
  previewWrap.classList.add("visible");
  setTimeout(() => {
    previewWrap.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

function hidePreview() {
  previewWrap.classList.remove("visible");
  previewVideo.style.display = "none";
  previewImage.style.display = "none";
  previewVideo.src = "";
  previewImage.src = "";
}

function shakeRow() {
  const row = document.getElementById("download-module");
  row.style.animation = "none";
  void row.offsetWidth;
  row.style.animation = "shake 0.4s ease";
  setTimeout(() => { row.style.animation = ""; }, 450);
}

/* ---- Enter key ---- */
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchMedia();
});

/* ---- Navbar scroll effect ---- */
const nav = document.getElementById("nav");

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  nav.style.background = y > 40
    ? "rgba(255,255,255,0.14)"
    : "rgba(255,255,255,0.10)";
}, { passive: true });