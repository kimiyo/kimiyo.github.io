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

  // Dropdown menu item click handler
  const dropdownItems = document.querySelectorAll('.dropdown-item[data-action]');
  const modal = document.getElementById('game-modal');
  const gameIframe = document.getElementById('game-iframe');
  const closeModalBtn = document.getElementById('close-game-modal');
  
  // 게임 URL 매핑
  const gameUrls = {
    'interactive-story-navigator': 'interative_navigator/interactive_navigator.html',
    'picture-puzzle-game': 'picture_puzzle_game/picture_puzzle_game.html'
  };
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const action = item.getAttribute('data-action');
      const gameUrl = gameUrls[action];
      
      if (gameUrl && modal && gameIframe) {
        // iframe에 게임 URL 로드
        gameIframe.src = gameUrl;
        // 모달 열기
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
      }
    });
  });

  // 모달 닫기 버튼
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // 스크롤 복원
        // iframe 내용 초기화 (선택사항)
        if (gameIframe) {
          gameIframe.src = '';
        }
      }
    });
  }

  // 모달 배경 클릭 시 닫기
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // 스크롤 복원
        // iframe 내용 초기화 (선택사항)
        if (gameIframe) {
          gameIframe.src = '';
        }
      }
    });
  }

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // 스크롤 복원
      // iframe 내용 초기화 (선택사항)
      if (gameIframe) {
        gameIframe.src = '';
      }
    }
  });
})();


