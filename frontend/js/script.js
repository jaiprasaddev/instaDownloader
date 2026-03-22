"use strict";

const API_BASE = "";

const inputField = document.getElementById("insta-link");
const btnFetch = document.getElementById("btn-fetch");
const statusMsg = document.getElementById("status-msg");
const previewSec = document.getElementById("result-preview");
const previewVideo = document.getElementById("preview-video");
const previewImage = document.getElementById("preview-image");
const resultThumb = document.getElementById("result-thumb");
const thumbPlaceholder = document.getElementById("thumb-placeholder");
const btnSave = document.getElementById("btn-save");
const btnCopy = document.getElementById("btn-copy-link");
const inputClear = document.getElementById("input-clear");
const dlShell = document.getElementById("dl-shell");
const inputWrap = document.querySelector(".dl-input-wrap");
const pasteHint = document.getElementById("paste-hint");
const errorBanner = document.getElementById("error-banner");
const errorText = document.getElementById("error-banner-text");
const errorDismiss = document.getElementById("error-dismiss");

const metaFormat = document.getElementById("meta-format");
const metaResolution = document.getElementById("meta-resolution");
const metaSize = document.getElementById("meta-size");

let currentProxyUrl = "";
let currentType = "video";

(function initYear() {
  const y = document.getElementById("footer-year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

(function initNavbar() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  window.addEventListener(
    "scroll",
    () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    },
    { passive: true }
  );
})();

(function initMobileMenu() {
  const burger = document.getElementById("nav-burger");
  const drawer = document.getElementById("mobile-menu");
  const closeBtn = document.getElementById("mobile-close");
  const backdrop = document.getElementById("mobile-backdrop");
  const cta = document.getElementById("mobile-drawer-cta");

  if (!burger || !drawer) return;

  function open() {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-visible");
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  burger.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? closeMenu() : open();
  });

  closeBtn && closeBtn.addEventListener("click", closeMenu);
  backdrop && backdrop.addEventListener("click", closeMenu);
  cta && cta.addEventListener("click", closeMenu);

  drawer.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
})();

function showError(msg) {
  if (!errorBanner || !errorText) {
    setStatus(msg, "error");
    return;
  }
  errorText.textContent = msg;
  errorBanner.hidden = false;
  setStatus("", "");
}

function hideError() {
  if (errorBanner) errorBanner.hidden = true;
}

errorDismiss &&
  errorDismiss.addEventListener("click", () => {
    hideError();
  });

inputField.addEventListener("input", () => {
  const hasVal = inputField.value.length > 0;
  inputClear.hidden = !hasVal;
  if (hasVal) {
    hideError();
    setStatus("", "");
  }
});

inputClear.addEventListener("click", () => {
  inputField.value = "";
  inputClear.hidden = true;
  inputField.focus();
  hideError();
  setStatus("", "");
});

btnFetch.addEventListener("click", fetchMedia);

inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchMedia();
});

inputField.addEventListener("paste", () => {
  inputWrap.classList.add("is-pasted");
  pasteHint.textContent = "Pasted";
  pasteHint.classList.add("is-visible");
  hideError();
  window.setTimeout(() => {
    pasteHint.classList.remove("is-visible");
    window.setTimeout(() => {
      inputWrap.classList.remove("is-pasted");
      pasteHint.textContent = "";
    }, 280);
  }, 1400);
});

btnSave.addEventListener("click", (e) => {
  e.preventDefault();
  if (currentProxyUrl) downloadBlob(currentProxyUrl, currentType);
});

btnCopy &&
  btnCopy.addEventListener("click", async () => {
    if (!currentProxyUrl) return;
    const absolute = new URL(currentProxyUrl, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(absolute);
      const prev = btnCopy.textContent;
      btnCopy.textContent = "Copied!";
      window.setTimeout(() => {
        btnCopy.textContent = prev;
      }, 2000);
    } catch {
      showError("Could not copy to clipboard.");
    }
  });

async function fetchMedia() {
  const url = inputField.value.trim();

  if (!url) {
    showError("Paste an Instagram URL to get started.");
    shakeInput();
    return;
  }

  hidePreview();
  hideError();
  setStatus("", "");
  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!data.success) {
      showError(data.message || "Could not fetch media. Check the link and try again.");
      setLoading(false);
      shakeInput();
      return;
    }

    currentProxyUrl = `/proxy?url=${encodeURIComponent(data.url)}`;
    currentType = data.type === "image" ? "image" : "video";

    metaFormat.textContent = currentType === "video" ? "MP4" : "JPG";
    metaResolution.textContent = data.width && data.height ? `${data.width}×${data.height}` : "HD";

    let sizeBytes = typeof data.size === "number" && data.size >= 0 ? data.size : null;
    if (sizeBytes == null) {
      sizeBytes = await fetchSizeViaProxyHead(currentProxyUrl);
    }
    metaSize.textContent = sizeBytes != null ? formatBytes(sizeBytes) : "—";

    if (resultThumb) {
      resultThumb.classList.remove("result-card__thumb--video", "result-card__thumb--image");
    }

    if (currentType === "video") {
      resultThumb && resultThumb.classList.add("result-card__thumb--video");
      previewImage.removeAttribute("src");
      previewImage.hidden = true;
      previewVideo.hidden = false;
      previewVideo.src = currentProxyUrl;
      thumbPlaceholder.hidden = true;
      previewVideo.addEventListener(
        "loadedmetadata",
        function onMeta() {
          previewVideo.removeEventListener("loadedmetadata", onMeta);
          if (previewVideo.videoWidth && previewVideo.videoHeight) {
            metaResolution.textContent = `${previewVideo.videoWidth}×${previewVideo.videoHeight}`;
          }
        },
        { once: true }
      );
    } else {
      resultThumb && resultThumb.classList.add("result-card__thumb--image");
      try {
        previewVideo.pause();
      } catch (_) {}
      previewVideo.removeAttribute("src");
      previewVideo.hidden = true;
      previewImage.hidden = false;
      previewImage.src = currentProxyUrl;
      thumbPlaceholder.hidden = true;
    }

    showPreview();
    setStatus("Ready — preview below.", "success");
  } catch (err) {
    console.error(err);
    showError("Server error — please try again.");
    shakeInput();
  } finally {
    setLoading(false);
  }
}

function formatBytes(n) {
  if (typeof n !== "number" || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchSizeViaProxyHead(proxyUrl) {
  try {
    const r = await fetch(proxyUrl, { method: "HEAD" });
    const cl = r.headers.get("Content-Length");
    if (cl != null && cl !== "") {
      const n = parseInt(cl, 10);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

async function downloadBlob(proxyUrl, type) {
  const label = btnSave.textContent;
  btnSave.textContent = "Preparing…";

  try {
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const ext = type === "video" || type === "mp4" ? "mp4" : "jpg";

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `instafetch_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
    btnSave.textContent = label;
  } catch {
    showError("Download failed — try again.");
    btnSave.textContent = label;
  }
}

function setLoading(on) {
  btnFetch.classList.toggle("is-loading", on);
  btnFetch.disabled = on;
}

function setStatus(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = "dl-status__text" + (type ? ` is-${type}` : "");
}

function showPreview() {
  previewSec.setAttribute("data-visible", "true");
  previewSec.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    previewSec.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 80);
}

function hidePreview() {
  previewSec.setAttribute("data-visible", "false");
  previewSec.setAttribute("aria-hidden", "true");
  if (resultThumb) {
    resultThumb.classList.remove("result-card__thumb--video", "result-card__thumb--image");
  }
  try {
    previewVideo.pause();
  } catch (_) {}
  previewVideo.hidden = true;
  previewVideo.removeAttribute("src");
  previewImage.hidden = true;
  previewImage.removeAttribute("src");
  thumbPlaceholder.hidden = false;
  currentProxyUrl = "";
}

function shakeInput() {
  dlShell.classList.remove("is-shaking");
  void dlShell.offsetWidth;
  dlShell.classList.add("is-shaking");
  window.setTimeout(() => dlShell.classList.remove("is-shaking"), 500);
}
