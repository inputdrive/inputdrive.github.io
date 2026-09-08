(function () {
  var API = "https://api.cdnjs.com/libraries";
  var LIMIT = 12;
  var DEBOUNCE_MS = 280;

  var form = document.getElementById("cdn-form");
  var input = document.getElementById("cdn-query");
  var status = document.getElementById("cdn-status");
  var results = document.getElementById("cdn-results");
  var empty = document.getElementById("cdn-empty");
  var live = document.getElementById("cdn-live");
  var abortCtrl = null;
  var timer = null;
  var lastQuery = "";

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function setLive(text) {
    if (live) live.textContent = text || "";
  }

  function escapeAttr(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function snippetFor(url, sri) {
    var safeUrl = String(url || "");
    var isCss = /\.css(\?|#|$)/i.test(safeUrl);
    if (isCss) {
      return sri
        ? '<link rel="stylesheet" href="' + escapeAttr(safeUrl) + '" integrity="' + escapeAttr(sri) + '" crossorigin="anonymous" referrerpolicy="no-referrer">'
        : '<link rel="stylesheet" href="' + escapeAttr(safeUrl) + '" crossorigin="anonymous" referrerpolicy="no-referrer">';
    }
    return sri
      ? '<script src="' + escapeAttr(safeUrl) + '" integrity="' + escapeAttr(sri) + '" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>'
      : '<script src="' + escapeAttr(safeUrl) + '" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>';
  }

  function copyText(text, button) {
    var done = function () {
      if (!button) return;
      var prev = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(function () {
        button.textContent = prev;
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      done();
    } catch (err) {
      setStatus("Copy failed. Select the snippet and copy it manually.");
    }
    document.body.removeChild(area);
  }

  function clearResults() {
    if (results) results.innerHTML = "";
  }

  function showEmpty(show) {
    if (empty) empty.hidden = !show;
  }

  function renderError(message) {
    clearResults();
    showEmpty(false);
    var note = document.createElement("p");
    note.className = "banner";
    note.textContent = message;
    results.appendChild(note);
  }

  function renderList(items, total) {
    clearResults();
    if (!items.length) {
      showEmpty(true);
      setStatus("No libraries matched.");
      setLive("No libraries matched.");
      return;
    }
    showEmpty(false);
    setStatus(total > items.length
      ? "Showing " + items.length + " of " + total + " matches. Refine the name for a tighter list."
      : items.length + (items.length === 1 ? " library" : " libraries") + ".");
    setLive(status.textContent);

    items.forEach(function (lib) {
      var card = document.createElement("article");
      card.className = "cdn-card";

      var head = document.createElement("div");
      head.className = "cdn-card-head";
      var title = document.createElement("h3");
      title.textContent = lib.name || "unknown";
      var ver = document.createElement("span");
      ver.className = "cdn-version";
      ver.textContent = lib.version ? "v" + lib.version : "version unknown";
      head.appendChild(title);
      head.appendChild(ver);

      var desc = document.createElement("p");
      desc.className = "small";
      desc.textContent = lib.description || "No description from cdnjs.";

      var meta = document.createElement("p");
      meta.className = "mono small";
      meta.textContent = lib.latest || "No default file URL.";

      var actions = document.createElement("div");
      actions.className = "cta-row";

      var copyUrl = document.createElement("button");
      copyUrl.type = "button";
      copyUrl.className = "btn btn-secondary";
      copyUrl.textContent = "Copy URL";
      copyUrl.disabled = !lib.latest;
      copyUrl.addEventListener("click", function () {
        if (lib.latest) copyText(lib.latest, copyUrl);
      });

      var copyTag = document.createElement("button");
      copyTag.type = "button";
      copyTag.className = "btn";
      copyTag.textContent = lib.sri ? "Copy tag with SRI" : "Copy tag";
      copyTag.disabled = !lib.latest;
      copyTag.addEventListener("click", function () {
        if (lib.latest) copyText(snippetFor(lib.latest, lib.sri), copyTag);
      });

      var open = document.createElement("a");
      open.className = "btn btn-secondary";
      open.href = "https://cdnjs.com/libraries/" + encodeURIComponent(lib.name || "");
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "cdnjs page";

      actions.appendChild(copyUrl);
      actions.appendChild(copyTag);
      actions.appendChild(open);

      var pre = document.createElement("pre");
      pre.className = "cdn-snippet";
      var code = document.createElement("code");
      code.textContent = lib.latest ? snippetFor(lib.latest, lib.sri) : "No snippet available.";
      pre.appendChild(code);

      if (!lib.sri) {
        var warn = document.createElement("p");
        warn.className = "small";
        warn.textContent = "cdnjs did not return an SRI hash for the default file. Do not load it on a high-assurance page until you pin a hash yourself.";
        card.appendChild(head);
        card.appendChild(desc);
        card.appendChild(meta);
        card.appendChild(pre);
        card.appendChild(warn);
        card.appendChild(actions);
      } else {
        card.appendChild(head);
        card.appendChild(desc);
        card.appendChild(meta);
        card.appendChild(pre);
        card.appendChild(actions);
      }

      results.appendChild(card);
    });
  }

  function search(query) {
    var q = String(query || "").trim();
    if (q === lastQuery && results && results.children.length) return;
    lastQuery = q;
    if (!q) {
      if (abortCtrl) abortCtrl.abort();
      clearResults();
      showEmpty(true);
      setStatus("Type a library name, or pick a starting point.");
      return;
    }

    if (abortCtrl) abortCtrl.abort();
    abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    setStatus("Searching cdnjs…");
    setLive("Searching cdnjs.");
    showEmpty(false);

    var url = API + "?search=" + encodeURIComponent(q) + "&fields=description,version,filename,sri&limit=" + LIMIT;
    var opts = { headers: { Accept: "application/json" } };
    if (abortCtrl) opts.signal = abortCtrl.signal;

    fetch(url, opts)
      .then(function (res) {
        if (!res.ok) throw new Error("cdnjs returned " + res.status);
        return res.json();
      })
      .then(function (data) {
        var items = Array.isArray(data.results) ? data.results : [];
        var total = typeof data.available === "number" ? data.available : items.length;
        renderList(items, total);
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        renderError("Could not reach the cdnjs API. Check the network and try again. Nothing was loaded from the CDN itself.");
        setStatus("Search failed.");
        setLive("Search failed.");
      });
  }

  function scheduleSearch(query) {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      search(query);
    }, DEBOUNCE_MS);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      window.clearTimeout(timer);
      search(input ? input.value : "");
    });
  }
  if (input) {
    input.addEventListener("input", function () {
      scheduleSearch(input.value);
    });
  }

  document.querySelectorAll("[data-cdn-chip]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var value = chip.getAttribute("data-cdn-chip") || "";
      if (input) input.value = value;
      window.clearTimeout(timer);
      search(value);
      if (input) input.focus();
    });
  });
})();
