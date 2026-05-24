const DashboardPage = {
  async render() {
    Loader.show();
    const user = API.getUser();
    try {
      const res = await API.tasks.list({ limit: 100 });
      const tasks = res.data || [];
      const completed = tasks.filter((t) => t.status === 'completed');
      const pending = tasks.filter((t) => ['pending', 'in_progress'].includes(t.status));
      const overdue = tasks.filter((t) => Utils.isOverdue(t));
      const avgScore =
        completed.length > 0
          ? Math.round(
              completed.reduce((s, t) => s + (t.performanceScore || 0), 0) / completed.length
            )
          : 0;
      const completionRate =
        tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

      document.getElementById('app-content').innerHTML = `
        <div class="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, ${Utils.escapeHtml(user.name)}</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('#/tasks/new')">+ New Task</button>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card gradient-1">
            <span class="kpi-label">Total Tasks</span>
            <span class="kpi-value">${tasks.length}</span>
          </div>
          <div class="kpi-card gradient-2">
            <span class="kpi-label">Completed</span>
            <span class="kpi-value">${completed.length}</span>
          </div>
          <div class="kpi-card gradient-3">
            <span class="kpi-label">Pending</span>
            <span class="kpi-value">${pending.length}</span>
          </div>
          <div class="kpi-card gradient-4">
            <span class="kpi-label">Overdue</span>
            <span class="kpi-value">${overdue.length}</span>
          </div>
          <div class="kpi-card gradient-5">
            <span class="kpi-label">Avg Score</span>
            <span class="kpi-value">${avgScore}</span>
          </div>
          <div class="kpi-card gradient-6">
            <span class="kpi-label">Completion</span>
            <span class="kpi-value">${completionRate}%</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Recent Tasks</h3>
            <a href="#/tasks" class="link">View all →</a>
          </div>
          <div class="table-responsive">
            ${this.renderTaskTable(tasks.slice(0, 8))}
          </div>
        </div>
      `;
    } catch (err) {
      Toast.error(err.message);
    }
  },

  renderTaskTable(tasks) {
    if (!tasks.length) {
      return '<div class="empty-state"><p>No tasks yet</p></div>';
    }
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Due</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (t) => `
            <tr class="${Utils.isOverdue(t) ? 'row-overdue' : ''}">
              <td><strong>${Utils.escapeHtml(t.title)}</strong></td>
              <td><span class="badge ${Utils.getPriorityClass(t.priority)}">${Utils.capitalize(t.priority)}</span></td>
              <td><span class="badge ${Utils.getStatusClass(t.status)}">${Utils.capitalize(t.status)}</span></td>
              <td><div class="inline-progress">${Charts.progressBar(t.progress || 0)}</div></td>
              <td>${Utils.formatDate(t.dueDate)}</td>
              <td><button class="btn btn-sm btn-ghost" onclick="App.navigate('#/tasks/${t._id}')">View</button></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  },
};

window.DashboardPage = DashboardPage;
