(function () {
  var timeEl = document.getElementById("lastModifiedTime");
  if (!timeEl) return;
  var dt = new Date(document.lastModified || new Date());
  timeEl.setAttribute("datetime", dt.toISOString());
  timeEl.textContent = "Page last edited: " + dt.toLocaleString();
})();
