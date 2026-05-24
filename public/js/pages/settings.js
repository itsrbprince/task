const SettingsPage = {
  render() {
    const user = API.getUser();
    document.getElementById('app-content').innerHTML = `
      <div class="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account security</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="card">
          <h3>Profile</h3>
          <dl class="detail-list">
            <dt>Name</dt><dd>${Utils.escapeHtml(user?.name)}</dd>
            <dt>Email</dt><dd>${Utils.escapeHtml(user?.email)}</dd>
            <dt>Department</dt><dd>${Utils.escapeHtml(user?.department || '—')}</dd>
            <dt>Role</dt><dd>${Utils.capitalize(user?.role)}</dd>
          </dl>
        </div>

        <div class="card">
          <h3>Change Password</h3>
          <form id="change-password-form" class="auth-form">
            <div class="form-group">
              <label>Current password</label>
              <input type="password" name="currentPassword" required autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label>New password</label>
              <input type="password" name="newPassword" required minlength="6" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label>Confirm new password</label>
              <input type="password" name="confirmPassword" required minlength="6" autocomplete="new-password" />
            </div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.newPassword.value !== form.confirmPassword.value) {
        return Toast.error('New passwords do not match');
      }
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        await API.auth.changePassword({
          currentPassword: form.currentPassword.value,
          newPassword: form.newPassword.value,
        });
        Toast.success('Password updated successfully');
        form.reset();
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  },
};

window.SettingsPage = SettingsPage;
