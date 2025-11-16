(function () {
  const getStoredTheme = () => {
    try { return localStorage.getItem('theme'); } catch { return null; }
  };
  const setStoredTheme = (value) => {
    try { localStorage.setItem('theme', value); } catch {}
  };
  const prefersDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (mode) => {
    const html = document.documentElement;
    if (mode === 'light' || mode === 'dark') {
      html.setAttribute('data-theme', mode);
    } else {
      html.setAttribute('data-theme', 'system');
    }
  };

  const initTheme = () => {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') {
      applyTheme(stored);
    } else {
      applyTheme('system');
    }
  };

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle
  initTheme();
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      let next;
      if (current === 'light') next = 'dark';
      else if (current === 'dark') next = 'system';
      else next = prefersDark() ? 'light' : 'light'; // start explicit cycle
      applyTheme(next);
      setStoredTheme(next === 'system' ? '' : next);
    });
  }

  // Respect system changes only when in 'system' mode
  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', () => {
      const mode = document.documentElement.getAttribute('data-theme');
      if (mode === 'system') applyTheme('system');
    });
  }
})();


