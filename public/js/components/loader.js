const Loader = {
  show(container) {
    const el = container || document.getElementById('app-content');
    if (!el) return;
    el.innerHTML = `
      <div class="loader-wrapper">
        <div class="loader-spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  },

  overlay(show = true) {
    let overlay = document.getElementById('global-loader');
    if (!overlay && show) {
      overlay = document.createElement('div');
      overlay.id = 'global-loader';
      overlay.className = 'global-loader';
      overlay.innerHTML = '<div class="loader-spinner"></div>';
      document.body.appendChild(overlay);
    }
    if (overlay) overlay.classList.toggle('active', show);
  },
};

window.Loader = Loader;
