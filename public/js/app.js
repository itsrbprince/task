const App = {
  publicAuthPages: ['login', 'register', 'forgot-password', 'reset-password'],

  init() {
    Toast.init();
    if (window.APP_CONFIG?.apiConfigured === false) {
      console.warn('APP_CONFIG.apiConfigured is false — set API_BASE_URL on Netlify');
    }
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    this.navigate('#/login');
  },

  route() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    const app = document.getElementById('app');
    const user = API.getUser();
    const token = API.getToken();

    const isPublicPage = this.publicAuthPages.includes(parts[0]);

    if (!token && !isPublicPage) {
      return this.navigate('#/login');
    }

    if (token && ['login', 'register', 'forgot-password'].includes(parts[0])) {
      return this.navigate(user?.role === 'admin' ? '#/admin' : '#/dashboard');
    }

    if (isPublicPage) {
      app.className = 'app auth-layout';
      app.innerHTML = '<main id="app-content"></main>';
      const content = document.getElementById('app-content');

      if (parts[0] === 'login') {
        content.innerHTML = AuthPage.renderLogin();
        AuthPage.bindLogin();
      } else if (parts[0] === 'register') {
        content.innerHTML = AuthPage.renderRegister();
        AuthPage.bindRegister();
      } else if (parts[0] === 'forgot-password') {
        content.innerHTML = AuthPage.renderForgotPassword();
        AuthPage.bindForgotPassword();
      } else if (parts[0] === 'reset-password') {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const resetToken = params.get('token') || '';
        content.innerHTML = AuthPage.renderResetPassword(resetToken);
        AuthPage.bindResetPassword();
      }
      return;
    }

    app.className = 'app dashboard-layout';
    app.innerHTML = this.renderLayout(user);
    this.bindLayout();

    if (parts[0] === 'dashboard') {
      DashboardPage.render();
    } else if (parts[0] === 'tasks') {
      if (parts[1] === 'new') {
        TasksPage.openTaskModal();
        TasksPage.render();
      } else if (parts[1]) {
        TaskDetailPage.render(parts[1]);
      } else {
        TasksPage.render();
      }
    } else if (parts[0] === 'admin') {
      if (user?.role !== 'admin') {
        Toast.error('Access denied');
        return this.navigate('#/dashboard');
      }
      AdminPage.render(parts[1] || 'overview');
    } else if (parts[0] === 'settings') {
      SettingsPage.render();
    } else {
      this.navigate(user?.role === 'admin' ? '#/admin' : '#/dashboard');
    }
  },

  renderLayout(user) {
    const isAdmin = user?.role === 'admin';
    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">TP</div>
          <span>TaskPerform</span>
        </div>
        <nav class="sidebar-nav">
          <a href="#/dashboard" class="nav-item" data-route="dashboard">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <a href="#/tasks" class="nav-item" data-route="tasks">
            <span class="nav-icon">✓</span> Tasks
          </a>
          ${isAdmin ? `<a href="#/admin" class="nav-item" data-route="admin"><span class="nav-icon">⚙</span> Admin</a>` : ''}
          <a href="#/settings" class="nav-item" data-route="settings">
            <span class="nav-icon">🔒</span> Settings
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">${Utils.getInitials(user?.name)}</div>
            <div>
              <strong>${Utils.escapeHtml(user?.name || '')}</strong>
              <small>${Utils.capitalize(user?.role || '')}</small>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="logout-btn">Logout</button>
        </div>
      </aside>
      <div class="main-wrapper">
        <header class="topbar">
          <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
          <div class="topbar-title" id="page-title"></div>
        </header>
        <main id="app-content" class="main-content"></main>
      </div>
    `;
  },

  bindLayout() {
    const hash = window.location.hash;
    document.querySelectorAll('.nav-item').forEach((el) => {
      const route = el.dataset.route;
      el.classList.toggle('active', hash.includes(route));
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
