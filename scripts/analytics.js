(function(){
  /*
    Centralized analytics and ad-slot configuration.
    Update ADS_CONFIG below to change the left/right ad unit IDs site-wide,
    or add perPath entries for page-specific slots.
  */
  var ADS_CONFIG = {
    // Default ad unit IDs (replace with your real ad slot IDs)
    defaultLeft: '1111111111',
    defaultRight: '2222222222',
    // Per-path overrides (optional): keys should match location.pathname
    perPath: {
      // '/contact.html': { left: 'LEFT_ID', right: 'RIGHT_ID' }
    }
  };

  // Load gtag.js if not already present
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-LYXQD92WW5"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-LYXQD92WW5';
    document.head.appendChild(s);
  }

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);} 
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', 'G-LYXQD92WW5');

  // Load AdSense script if not present
  if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    var a = document.createElement('script');
    a.async = true;
    a.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5393775575907084';
    a.crossOrigin = 'anonymous';
    // When AdSense script loads, attempt to push any created ad slots
    a.addEventListener('load', function(){
      try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
    });
    document.head.appendChild(a);
  }

  // Helper: resolve which ad ids to use for current page
  function resolveSlotIds() {
    var path = window.location.pathname || '/';
    var cfg = ADS_CONFIG.perPath[path] || {};
    return {
      left: cfg.left || ADS_CONFIG.defaultLeft,
      right: cfg.right || ADS_CONFIG.defaultRight
    };
  }

  // Replace placeholder slot IDs in page <ins class="adsbygoogle"> elements
  function fillPlaceholders() {
    var ids = resolveSlotIds();
    var elems = document.querySelectorAll('ins.adsbygoogle[data-ad-slot]');
    elems.forEach(function(el){
      var slot = (el.getAttribute('data-ad-slot') || '').trim();
      if (!slot) return;
      if (slot.indexOf('REPLACE_LEFT') !== -1 && ids.left) {
        el.setAttribute('data-ad-slot', ids.left);
      } else if (slot.indexOf('REPLACE_RIGHT') !== -1 && ids.right) {
        el.setAttribute('data-ad-slot', ids.right);
      }
    });

    // Try to render ads immediately if the adsbygoogle object is available
    try {
      if (window.adsbygoogle) {
        document.querySelectorAll('ins.adsbygoogle').forEach(function(){
          try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
        });
      }
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillPlaceholders);
  } else {
    // If already ready, run immediately
    setTimeout(fillPlaceholders, 0);
  }

})();