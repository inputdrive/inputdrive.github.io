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
  }

  // Render ads when safe: wait for theme readiness to avoid visual flashes or interference
  function renderAdsSafe() {
    // For mobile, convert side ads into inline ads for better UX
    try {
      if (window.innerWidth <= 900) {
        // Convert first available left/right side ad(s) into inline ad(s) within <main>
        var main = document.querySelector('main');
        if (main) {
          // Remove any hidden/float layout issues by moving an ad inline
          var sideLeft = document.querySelector('.ads-side.left');
          var sideRight = document.querySelector('.ads-side.right');

          // Create inline ad for left slot if present
          if (sideLeft) {
            var leftIns = sideLeft.querySelector('ins.adsbygoogle');
            if (leftIns) {
              var clone = leftIns.cloneNode(true);
              clone.classList.add('ad-inline');
              main.insertBefore(clone, main.firstChild);
            }
            sideLeft.style.display = 'none';
          }

          if (sideRight) {
            var rightIns = sideRight.querySelector('ins.adsbygoogle');
            if (rightIns) {
              var cloneR = rightIns.cloneNode(true);
              cloneR.classList.add('ad-inline');
              // place after first block
              if (main.firstChild && main.firstChild.nextSibling) main.insertBefore(cloneR, main.firstChild.nextSibling);
              else main.appendChild(cloneR);
            }
            sideRight.style.display = 'none';
          }
        }
      } else {
        // Ensure side ads are visible on larger screens
        var sideEls = document.querySelectorAll('.ads-side');
        sideEls.forEach(function(el){ el.style.display = ''; });
      }

      // Push ads to be rendered
      if (window.adsbygoogle) {
        document.querySelectorAll('ins.adsbygoogle').forEach(function(){
          try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
        });
      }
    } catch (e) { console.warn('Ad render failed', e); }
  }

  // Trigger placeholder fill then wait for theme readiness before rendering
  function initAds() {
    fillPlaceholders();

    // If theme is ready, render now. Otherwise wait for 'site-theme-ready' with a timeout fallback
    var rendered = false;
    function doRender(){ if(!rendered){ rendered = true; renderAdsSafe(); } }

    if (window._siteThemeReady) { doRender(); }
    else {
      // Listen for custom event from theme.js
      document.addEventListener('site-theme-ready', doRender);
      // Fallback: render after 1s in case the theme event doesn't fire
      setTimeout(doRender, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAds);
  } else {
    // If already ready, run immediately
    setTimeout(initAds, 0);
  }

})();