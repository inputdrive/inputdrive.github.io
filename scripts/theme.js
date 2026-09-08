(function(){
  function preferredTheme(){
    try {
      var saved = localStorage.getItem('site-theme');
      if(saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function apply(theme){
    var t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    if(document.body) document.body.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggle');
    if(btn) btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
  }

  apply(preferredTheme());

  function init(){
    try {
      apply(preferredTheme());

      var btn = document.getElementById('themeToggle');
      if(!btn) return;
      btn.addEventListener('click', function(){
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var next = isDark ? 'light' : 'dark';
        apply(next);
        try { localStorage.setItem('site-theme', next); } catch (e) {}
      });

      try { document.dispatchEvent(new CustomEvent('site-theme-ready')); } catch(e) { console.warn('Could not dispatch site-theme-ready event'); }
    } catch(e){ console.error(e); }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();