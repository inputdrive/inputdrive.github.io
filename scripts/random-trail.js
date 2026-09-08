(function () {
  var BRANCHES = 5;
  var MAX_DEPTH = 5;
  var ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

  function clampDepth(value) {
    var n = parseInt(value, 10);
    if (!isFinite(n) || n < 0) return 0;
    if (n > MAX_DEPTH) return MAX_DEPTH;
    return n;
  }

  function sanitizeId(value) {
    var id = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
    return id || "";
  }

  function sanitizePath(value) {
    if (!value) return [];
    return String(value)
      .split(".")
      .map(sanitizeId)
      .filter(Boolean)
      .slice(0, MAX_DEPTH + 1);
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomId(rng) {
    var id = "";
    for (var i = 0; i < 8; i++) {
      id += ID_CHARS.charAt(Math.floor(rng() * ID_CHARS.length));
    }
    return id;
  }

  function cryptoId() {
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    var id = "";
    for (var j = 0; j < bytes.length; j++) {
      id += ID_CHARS.charAt(bytes[j] % ID_CHARS.length);
    }
    return id;
  }

  function childIds(nodeId) {
    var rng = mulberry32(hashString("trail:" + nodeId));
    var ids = [];
    var seen = {};
    while (ids.length < BRANCHES) {
      var next = randomId(rng);
      if (seen[next] || next === nodeId) continue;
      seen[next] = true;
      ids.push(next);
    }
    return ids;
  }

  function buildUrl(depth, nodeId, pathIds) {
    var url = new URL("random.html", window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("d", String(depth));
    url.searchParams.set("n", nodeId);
    if (pathIds && pathIds.length) {
      url.searchParams.set("p", pathIds.join("."));
    }
    return url.pathname + url.search;
  }

  function absoluteUrl(rel) {
    return new URL(rel, window.location.href).href;
  }

  function parseState() {
    var params = new URLSearchParams(window.location.search);
    var depth = clampDepth(params.get("d") || "0");
    var node = sanitizeId(params.get("n"));
    var path = sanitizePath(params.get("p"));
    return { depth: depth, node: node, path: path };
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function render() {
    var list = document.getElementById("trail-links");
    var status = document.getElementById("trail-status");
    var crumbs = document.getElementById("trail-crumbs");
    var endNote = document.getElementById("trail-end");
    if (!list || !status) return;

    var state = parseState();
    if (!state.node) {
      var fresh = cryptoId();
      var start = buildUrl(0, fresh, []);
      window.history.replaceState({}, "", start);
      state = { depth: 0, node: fresh, path: [] };
    }

    var atEnd = state.depth >= MAX_DEPTH;
    var ids = childIds(state.node);
    var crumbParts = state.path.concat([state.node]);
    crumbs.innerHTML = "";
    crumbParts.forEach(function (part, index) {
      if (index) crumbs.appendChild(document.createTextNode(" → "));
      var span = document.createElement("code");
      span.textContent = part;
      crumbs.appendChild(span);
    });

    var hopsLeft = MAX_DEPTH - state.depth;
    if (atEnd) {
      status.textContent =
        "Depth " + state.depth + " of " + MAX_DEPTH + ". This branch stops here.";
    } else if (state.depth === 0) {
      status.textContent =
        "Five URLs for this node. Each one opens five more, up to " + MAX_DEPTH + " hops.";
    } else {
      status.textContent =
        "Depth " + state.depth + " of " + MAX_DEPTH + ". " + hopsLeft +
        (hopsLeft === 1 ? " hop" : " hops") + " left on this branch.";
    }

    list.innerHTML = "";
    ids.forEach(function (id, index) {
      var li = document.createElement("li");
      var rel = buildUrl(state.depth + 1, id, crumbParts);
      var abs = absoluteUrl(rel);
      var row;
      if (atEnd) {
        row = document.createElement("div");
        row.className = "trail-link";
        row.setAttribute("aria-disabled", "true");
      } else {
        row = document.createElement("a");
        row.className = "trail-link";
        row.href = rel;
      }
      var label = document.createElement("span");
      label.className = "trail-index";
      label.textContent = String(index + 1);
      var urlSpan = document.createElement("span");
      urlSpan.className = "trail-url mono";
      urlSpan.textContent = abs;
      row.appendChild(label);
      row.appendChild(urlSpan);
      li.appendChild(row);
      list.appendChild(li);
    });

    if (endNote) {
      endNote.hidden = !atEnd;
    }

    var restart = document.getElementById("trail-restart");
    if (restart) {
      restart.href = "/random.html";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
