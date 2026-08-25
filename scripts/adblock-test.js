(function () {
  var AD_HOST = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
  var WAIT_MS = 2200;

  var resultsRoot = document.getElementById("ad-results");
  var summaryEl = document.getElementById("ad-summary");
  var liveEl = document.getElementById("ad-live");
  var rerunBtn = document.getElementById("ad-rerun");
  var controlEl = document.getElementById("ids-probe-control");
  var running = false;

  function probeUrl(kind) {
    return AD_HOST + "?ids=" + encodeURIComponent(kind) + "&t=" + Date.now();
  }

  function isCollapsed(el) {
    if (!el || !el.isConnected) return true;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return true;
    var rect = el.getBoundingClientRect();
    return rect.width < 2 || rect.height < 2;
  }

  function setStatus(text) {
    if (summaryEl) summaryEl.textContent = text || "";
    if (liveEl) liveEl.textContent = text || "";
  }

  function groupScore(rows) {
    var blocked = 0;
    rows.forEach(function (row) {
      if (row.blocked) blocked += 1;
    });
    return { blocked: blocked, total: rows.length };
  }

  function badgeText(group) {
    if (group.inverted) {
      return group.rows[0] && group.rows[0].blocked ? "Hidden" : "Visible";
    }
    var score = groupScore(group.rows);
    if (score.blocked === score.total) return "All blocked";
    if (score.blocked === 0) return "None blocked";
    return score.blocked + " / " + score.total + " blocked";
  }

  function rowMark(row) {
    if (row.inverted) return row.blocked ? "Fail" : "OK";
    return row.blocked ? "Yes" : "No";
  }

  function rowTone(row) {
    if (row.inverted) return row.blocked ? "is-fail" : "is-pass";
    return row.blocked ? "is-pass" : "is-fail";
  }

  function rowStatus(row) {
    if (row.inverted) return row.blocked ? "Hidden (problem)" : "Visible (good)";
    return row.blocked ? "Blocked" : "Not blocked";
  }

  function appendRow(list, row) {
    var li = document.createElement("li");
    li.className = "probe-row " + rowTone(row);
    var mark = document.createElement("span");
    mark.className = "probe-mark";
    mark.textContent = rowMark(row);
    var body = document.createElement("div");
    var title = document.createElement("strong");
    title.textContent = row.name;
    var meta = document.createElement("p");
    meta.className = "small";
    meta.textContent = rowStatus(row) + (row.detail ? " — " + row.detail : "");
    body.appendChild(title);
    body.appendChild(meta);
    li.appendChild(mark);
    li.appendChild(body);
    list.appendChild(li);
  }

  function render(groups, controlBroken) {
    resultsRoot.textContent = "";

    if (controlBroken) {
      var warn = document.createElement("p");
      warn.className = "banner";
      warn.textContent =
        "The control box was hidden. A filter is matching ordinary page chrome, so the scores below are not trustworthy.";
      resultsRoot.appendChild(warn);
    }

    var blockedCount = 0;
    var total = 0;

    groups.forEach(function (group) {
      var card = document.createElement("article");
      card.className = "cdn-card";

      var head = document.createElement("div");
      head.className = "cdn-card-head";
      var title = document.createElement("h3");
      title.textContent = group.title;
      var badge = document.createElement("span");
      badge.className = "cdn-version";
      badge.textContent = badgeText(group);
      head.appendChild(title);
      head.appendChild(badge);

      var blurb = document.createElement("p");
      blurb.className = "small";
      blurb.textContent = group.blurb;

      var ul = document.createElement("ul");
      ul.className = "probe-list";
      group.rows.forEach(function (row) {
        if (!row.inverted) {
          total += 1;
          if (row.blocked) blockedCount += 1;
        }
        appendRow(ul, row);
      });

      card.appendChild(head);
      card.appendChild(blurb);
      card.appendChild(ul);
      resultsRoot.appendChild(card);
    });

    if (controlBroken) {
      setStatus("Control failed. Treat every result as unreliable.");
    } else if (blockedCount === total) {
      setStatus(
        "All " + total + " probes were blocked. Cosmetic filters, network, and script execution are all being stopped."
      );
    } else if (blockedCount === 0) {
      setStatus(
        "None of the " + total + " probes were blocked. No typical EasyList-style blocker is active in this browser, or it is disabled on this site."
      );
    } else {
      setStatus(
        blockedCount + " of " + total + " probes blocked. Cosmetic and network rules are not doing the same job."
      );
    }
  }

  function checkNetwork(url) {
    if (!window.fetch) {
      return Promise.resolve({ blocked: true, detail: "fetch is not available" });
    }
    var timedOut = false;
    var timer;
    var timeout = new Promise(function (resolve) {
      timer = window.setTimeout(function () {
        timedOut = true;
        resolve({ blocked: true, detail: "request timed out (likely blocked)" });
      }, WAIT_MS);
    });
    var req = fetch(url, { mode: "no-cors", cache: "no-store", credentials: "omit" })
      .then(function () {
        if (timedOut) return null;
        return { blocked: false, detail: "browser completed a request to the ad host" };
      })
      .catch(function () {
        if (timedOut) return null;
        return { blocked: true, detail: "request was aborted or failed" };
      });
    return Promise.race([req, timeout]).then(function (result) {
      window.clearTimeout(timer);
      return result || { blocked: true, detail: "request timed out (likely blocked)" };
    });
  }

  function checkScript(url) {
    return new Promise(function (resolve) {
      var existing = document.getElementById("probe-script");
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      var before = typeof window.adsbygoogle !== "undefined";
      var settled = false;
      function finish(blocked, detail) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({ blocked: blocked, detail: detail });
      }

      var el = document.createElement("script");
      el.id = "probe-script";
      el.async = true;
      el.src = url;
      el.crossOrigin = "anonymous";
      el.referrerPolicy = "no-referrer";
      el.onload = function () {
        finish(
          false,
          before || typeof window.adsbygoogle !== "undefined"
            ? "script loaded and ran"
            : "script loaded"
        );
      };
      el.onerror = function () {
        finish(true, "script failed to load");
      };
      var timer = window.setTimeout(function () {
        var node = document.getElementById("probe-script");
        var removed = !node || !node.isConnected;
        var ran = typeof window.adsbygoogle !== "undefined";
        if (ran) finish(false, "script object appeared");
        else if (removed) finish(true, "script node was removed");
        else finish(true, "script did not execute in time");
      }, WAIT_MS);
      document.head.appendChild(el);
    });
  }

  function cosmeticRows() {
    return [
      {
        name: ".ad-banner",
        blocked: isCollapsed(document.querySelector(".ad-banner")),
        detail: "generic advertisement class"
      },
      {
        name: "div.adsbygoogle",
        blocked: isCollapsed(document.getElementById("probe-div")),
        detail: "Google Ads class on a div"
      },
      {
        name: "ins.adsbygoogle",
        blocked: isCollapsed(document.getElementById("probe-ins")),
        detail: "AdSense ins bait"
      },
      {
        name: ".adsbox",
        blocked: isCollapsed(document.querySelector(".adsbox")),
        detail: "classic EasyList bait"
      }
    ];
  }

  function run() {
    if (running) return;
    running = true;
    if (rerunBtn) rerunBtn.disabled = true;
    setStatus("Running probes…");
    resultsRoot.textContent = "";

    Promise.all([checkNetwork(probeUrl("net")), checkScript(probeUrl("js"))])
      .then(function (pair) {
        var network = pair[0];
        var script = pair[1];
        var controlBroken = isCollapsed(controlEl);
        render(
          [
            {
              title: "Control",
              blurb: "Ordinary page chrome. This must stay visible or the rest of the page is over-matched.",
              inverted: true,
              rows: [
                {
                  name: "Baseline box",
                  blocked: controlBroken,
                  inverted: true,
                  detail: "not an ad slot"
                }
              ]
            },
            {
              title: "Cosmetic",
              blurb: "Filter lists hide nodes by id or class. These boxes should vanish if EasyList-style rules are on.",
              rows: cosmeticRows()
            },
            {
              title: "Network",
              blurb: "A no-cors request to Google’s ad script host. Blockers that cut the request fail the fetch; a completed request means the host is reachable.",
              rows: [
                {
                  name: "pagead2.googlesyndication.com",
                  blocked: network.blocked,
                  detail: network.detail
                }
              ]
            },
            {
              title: "Script",
              blurb: "The same ad script, without a publisher id. If it executes, window.adsbygoogle shows up. No ads are requested beyond loading that file.",
              rows: [
                {
                  name: "adsbygoogle.js execution",
                  blocked: script.blocked,
                  detail: script.detail
                }
              ]
            }
          ],
          controlBroken
        );
      })
      .finally(function () {
        running = false;
        if (rerunBtn) rerunBtn.disabled = false;
      });
  }

  if (rerunBtn) {
    rerunBtn.addEventListener("click", run);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
