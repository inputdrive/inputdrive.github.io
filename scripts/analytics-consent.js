(function(){
  var MEASUREMENT_ID = 'G-LYXQD92WW5';
  var CONSENT_KEY = 'analytics-consent-v1';
  var REGION_CODES = {
    AT: 1, BE: 1, BG: 1, HR: 1, CY: 1, CZ: 1, DK: 1, EE: 1, FI: 1, FR: 1,
    DE: 1, GR: 1, HU: 1, IS: 1, IE: 1, IT: 1, LV: 1, LI: 1, LT: 1, LU: 1,
    MT: 1, NL: 1, NO: 1, PL: 1, PT: 1, RO: 1, SK: 1, SI: 1, ES: 1, SE: 1,
    CH: 1, GB: 1
  };

  function safeGet(key){
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(key, value){
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function getRegionCode(){
    var langs = [];
    if (navigator.languages && navigator.languages.length) langs = navigator.languages.slice(0);
    else if (navigator.language) langs = [navigator.language];
    for (var i = 0; i < langs.length; i += 1) {
      var match = /-([A-Za-z]{2})$/.exec(langs[i]);
      if (match) return match[1].toUpperCase();
    }
    return '';
  }

  function requiresConsent(){
    if (navigator.globalPrivacyControl === true) return true;
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') return true;

    var region = getRegionCode();
    if (region && REGION_CODES[region]) return true;

    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.indexOf('Europe/') === 0) return true;
    } catch (e) {}

    return false;
  }

  function setDeniedDefault(){
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function loadGtag(){
    if (document.getElementById('ga4-gtag-loader')) return;
    var script = document.createElement('script');
    script.id = 'ga4-gtag-loader';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function initAnalytics(consentGranted){
    setDeniedDefault();
    if (!consentGranted) return;

    loadGtag();
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });
  }

  function removeBanner(){
    var existing = document.getElementById('analytics-consent-banner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function showBanner(){
    removeBanner();
    var banner = document.createElement('div');
    banner.id = 'analytics-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Analytics consent');
    banner.style.position = 'fixed';
    banner.style.left = '16px';
    banner.style.right = '16px';
    banner.style.bottom = '16px';
    banner.style.zIndex = '9999';
    banner.style.maxWidth = '720px';
    banner.style.margin = '0 auto';
    banner.style.padding = '14px';
    banner.style.border = '1px solid var(--border, #d0d7de)';
    banner.style.borderRadius = '10px';
    banner.style.background = 'var(--panel, #fff)';
    banner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.16)';

    var text = document.createElement('p');
    text.style.margin = '0 0 10px 0';
    text.textContent = 'We use privacy-focused analytics (pageviews only) to understand site usage. You can allow or decline analytics tracking.';
    banner.appendChild(text);

    var actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.flexWrap = 'wrap';

    var allowButton = document.createElement('button');
    allowButton.type = 'button';
    allowButton.className = 'btn';
    allowButton.textContent = 'Allow analytics';
    allowButton.addEventListener('click', function(){
      safeSet(CONSENT_KEY, 'granted');
      removeBanner();
      initAnalytics(true);
    });
    actions.appendChild(allowButton);

    var denyButton = document.createElement('button');
    denyButton.type = 'button';
    denyButton.className = 'btn btn-secondary';
    denyButton.textContent = 'Decline';
    denyButton.addEventListener('click', function(){
      safeSet(CONSENT_KEY, 'denied');
      removeBanner();
      initAnalytics(false);
    });
    actions.appendChild(denyButton);

    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  function start(){
    var consentRequired = requiresConsent();
    var stored = safeGet(CONSENT_KEY);
    if (consentRequired) {
      if (stored === 'granted') initAnalytics(true);
      else if (stored === 'denied') initAnalytics(false);
      else showBanner();
      return;
    }

    if (stored === 'denied') {
      initAnalytics(false);
      return;
    }

    initAnalytics(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
