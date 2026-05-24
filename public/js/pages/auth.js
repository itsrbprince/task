const AuthPage = {
  renderLogin() {
    return `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-brand">
            <div class="brand-icon">TP</div>
            <h1>TaskPerform</h1>
            <p>Enterprise Performance Management</p>
          </div>
          <form id="login-form" class="auth-form">
            <h2>Welcome back</h2>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@company.com" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" required placeholder="••••••••" />
            </div>
            <div class="form-group form-group-inline">
              <a href="#/forgot-password" class="forgot-link">Forgot password?</a>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
            <p class="auth-switch">Don't have an account? <a href="#/register">Register</a></p>
          </form>
          <div class="auth-demo" id="api-setup-notice" style="display:none">
            <p><strong>Netlify setup:</strong> Add <code>API_BASE_URL</code> = your Render URL + <code>/api</code>, then redeploy. Keep <code>MONGODB_URI</code> on Render only.</p>
          </div>
          <div class="auth-demo">
            <p><strong>Demo:</strong> admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    `;
  },

  renderRegister() {
    return `
      <div class="auth-page">
        <div class="auth-card auth-card-wide">
          <div class="auth-brand">
            <div class="brand-icon">TP</div>
            <h1>Create Account</h1>
          </div>
          <form id="register-form" class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required minlength="6" />
              </div>
              <div class="form-group">
                <label>Department</label>
                <input type="text" name="department" required placeholder="e.g. Engineering" />
              </div>
            </div>
            <div class="form-group">
              <label>Designation</label>
              <input type="text" name="designation" placeholder="Team Member" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
            <p class="auth-switch">Already have an account? <a href="#/login">Sign In</a></p>
          </form>
        </div>
      </div>
    `;
  },

  renderForgotPassword() {
    return `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-brand">
            <div class="brand-icon">TP</div>
            <h1>Reset Password</h1>
          </div>
          <form id="forgot-form" class="auth-form">
            <h2>Forgot password?</h2>
            <p class="text-muted">Enter your email. In development mode you'll receive a reset link on screen.</p>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" required placeholder="you@company.com" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
            <p class="auth-switch"><a href="#/login">← Back to Sign In</a></p>
          </form>
          <div id="reset-link-box" class="reset-link-box hidden"></div>
        </div>
      </div>
    `;
  },

  renderResetPassword(token) {
    return `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-brand">
            <div class="brand-icon">TP</div>
            <h1>New Password</h1>
          </div>
          <form id="reset-form" class="auth-form">
            <h2>Set new password</h2>
            <input type="hidden" name="token" value="${Utils.escapeHtml(token || '')}" />
            <div class="form-group">
              <label>New password</label>
              <input type="password" name="password" required minlength="6" />
            </div>
            <div class="form-group">
              <label>Confirm password</label>
              <input type="password" name="confirmPassword" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
            <p class="auth-switch"><a href="#/login">← Back to Sign In</a></p>
          </form>
        </div>
      </div>
    `;
  },

  bindLogin() {
    if (window.APP_CONFIG?.apiConfigured === false) {
      const notice = document.getElementById('api-setup-notice');
      if (notice) notice.style.display = 'block';
    }
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const res = await API.auth.login({
          email: form.email.value,
          password: form.password.value,
        });
        API.setToken(res.token);
        API.setUser(res.user);
        Toast.success('Welcome back!');
        App.navigate(res.user.role === 'admin' ? '#/admin' : '#/dashboard');
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  },

  bindRegister() {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const res = await API.auth.register({
          name: form.name.value,
          email: form.email.value,
          password: form.password.value,
          department: form.department.value,
          designation: form.designation.value || 'Team Member',
        });
        API.setToken(res.token);
        API.setUser(res.user);
        Toast.success('Account created!');
        App.navigate('#/dashboard');
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  },

  bindForgotPassword() {
    document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const res = await API.auth.forgotPassword({ email: form.email.value });
        Toast.success(res.message);
        const box = document.getElementById('reset-link-box');
        if (res.resetUrl && box) {
          box.classList.remove('hidden');
          box.innerHTML = `
            <p><strong>Development reset link:</strong></p>
            <a href="${res.resetUrl}" class="reset-url-link">${res.resetUrl}</a>
            <p class="text-muted">Copy this link to reset your password (email not configured).</p>
          `;
        }
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  },

  bindResetPassword() {
    document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.password.value !== form.confirmPassword.value) {
        return Toast.error('Passwords do not match');
      }
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        await API.auth.resetPassword({
          token: form.token.value,
          password: form.password.value,
        });
        Toast.success('Password reset! Please sign in.');
        App.navigate('#/login');
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  },
};

window.AuthPage = AuthPage;
