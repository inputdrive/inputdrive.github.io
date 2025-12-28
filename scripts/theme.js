(function(){
  function apply(theme){
    if(theme === 'dark'){
      document.body.setAttribute('data-theme','dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
    var btn = document.getElementById('themeToggle');
    if(btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function init(){
    try {
      var saved = localStorage.getItem('site-theme');
      if(saved) apply(saved);
      else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) apply('dark');

      var btn = document.getElementById('themeToggle');
      if(!btn) return;
      btn.addEventListener('click', function(){
        var isDark = document.body.getAttribute('data-theme') === 'dark';
        var next = isDark ? 'light' : 'dark';
        apply(next);
        localStorage.setItem('site-theme', next);
      });
    } catch(e){ console.error(e); }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();