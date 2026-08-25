(function () {
  var EMAIL = "info@inputdrivesecurity.us";
  var WA = "17039578321";

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function compose() {
    var name = val("name");
    var org = val("org");
    var fromEmail = val("email");
    var phone = val("phone");
    var track = val("track");
    var timing = val("timing");
    var message = val("message");

    var lines = [
      "Hello Greg,",
      "",
      message || "I would like to discuss contract or ad-hoc work.",
      "",
      "Name: " + (name || "(not provided)"),
      "Organization: " + (org || "(not provided)"),
      "Email: " + (fromEmail || "(not provided)"),
      "Phone: " + (phone || "(not provided)"),
      "Buyer track: " + (track || "(not provided)"),
      "Timing: " + (timing || "(not provided)"),
    ];
    var subjectTrack = track || "work inquiry";
    return {
      subject: "Work inquiry — " + subjectTrack,
      body: lines.join("\n"),
    };
  }

  function openMailto() {
    var c = compose();
    var url =
      "mailto:" +
      EMAIL +
      "?subject=" +
      encodeURIComponent(c.subject) +
      "&body=" +
      encodeURIComponent(c.body);
    window.location.href = url;
  }

  function openWhatsApp() {
    var c = compose();
    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(c.subject + "\n\n" + c.body);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  var form = document.getElementById("inquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
      openMailto();
    });
  }

  var waBtn = document.getElementById("whatsapp-submit");
  if (waBtn) {
    waBtn.addEventListener("click", function () {
      var formEl = document.getElementById("inquiry-form");
      if (formEl && typeof formEl.reportValidity === "function" && !formEl.reportValidity()) return;
      openWhatsApp();
    });
  }
})();
