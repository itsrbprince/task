const AdminPage = {
  activeTab: 'overview',

  async render(tab = 'overview') {
    this.activeTab = tab;
    const tabs = ['overview', 'employees', 'departments', 'leaderboard'];

    document.getElementById('app-content').innerHTML = `
      <div class="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Organization-wide performance analytics</p>
        </div>
      </div>
      <div class="admin-tabs">
        ${tabs
          .map(
            (t) =>
              `<button class="admin-tab ${t === tab ? 'active' : ''}" data-tab="${t}">${Utils.capitalize(t)}</button>`
          )
          .join('')}
      </div>
      <div id="admin-tab-content"></div>
    `;

    document.querySelectorAll('.admin-tab').forEach((btn) => {
      btn.onclick = () => {
        window.location.hash = `#/admin/${btn.dataset.tab}`;
        this.render(btn.dataset.tab);
      };
    });

    Loader.show(document.getElementById('admin-tab-content'));

    switch (tab) {
      case 'employees':
        await this.renderEmployees();
        break;
      case 'departments':
        await this.renderDepartments();
        break;
      case 'leaderboard':
        await this.renderLeaderboard();
        break;
      default:
        await this.renderOverview();
    }
  },

  async renderOverview() {
    try {
      const res = await API.admin.overview();
      const d = res.data;
      const container = document.getElementById('admin-tab-content');

      container.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card gradient-1"><span class="kpi-label">Employees</span><span class="kpi-value">${d.totalEmployees}</span></div>
          <div class="kpi-card gradient-2"><span class="kpi-label">Total Tasks</span><span class="kpi-value">${d.totalTasks}</span></div>
          <div class="kpi-card gradient-3"><span class="kpi-label">Completed</span><span class="kpi-value">${d.completedTasks}</span></div>
          <div class="kpi-card gradient-4"><span class="kpi-label">Pending</span><span class="kpi-value">${d.pendingTasks}</span></div>
          <div class="kpi-card gradient-5"><span class="kpi-label">Overdue</span><span class="kpi-value">${d.overdueTasks}</span></div>
          <div class="kpi-card gradient-6"><span class="kpi-label">Avg Score</span><span class="kpi-value">${d.averagePerformanceScore}</span></div>
        </div>

        <div class="stats-row">
          <div class="card stat-highlight">
            <h3>Completion Rate</h3>
            <div class="big-stat">${d.completionRate}%</div>
            ${Charts.progressBar(d.completionRate)}
          </div>
          <div class="card stat-highlight">
            <h3>Avg Performance</h3>
            <div class="big-stat">${d.averagePerformanceScore}</div>
            <p class="text-muted">Across completed tasks</p>
          </div>
        </div>

        <div class="charts-grid">
          <div class="card">
            <h3>Monthly Analytics</h3>
            <div id="monthly-chart"></div>
          </div>
          <div class="card">
            <h3>Department Distribution</h3>
            <div id="dept-chart"></div>
          </div>
        </div>
      `;

      Charts.multiBarChart(document.getElementById('monthly-chart'), d.monthlyAnalytics || [], {
        labelKey: 'label',
        keys: ['created', 'completed'],
        colors: ['#6366f1', '#22c55e'],
      });

      Charts.donutChart(
        document.getElementById('dept-chart'),
        (d.departmentDistribution || []).map((x) => ({
          label: x.department,
          value: x.count,
        }))
      );
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async renderEmployees() {
    try {
      const res = await API.admin.employees({ limit: 50 });
      const employees = res.data || [];
      const container = document.getElementById('admin-tab-content');

      container.innerHTML = `
        <div class="filters-bar card">
          <input type="search" id="emp-search" placeholder="Search employees..." />
          <select id="emp-dept-filter">
            <option value="">All Departments</option>
            ${[...new Set(employees.map((e) => e.department))].map((d) => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <select id="emp-sort">
            <option value="name">Sort by Name</option>
            <option value="performance">Sort by Performance</option>
          </select>
        </div>
        <div class="card" id="employees-table-wrap">
          ${this.renderEmployeesTable(employees)}
        </div>
      `;

      const loadFiltered = Utils.debounce(async () => {
        const search = document.getElementById('emp-search').value;
        const department = document.getElementById('emp-dept-filter').value;
        const sort = document.getElementById('emp-sort').value;
        const filtered = await API.admin.employees({ search, department, sort, limit: 50 });
        document.getElementById('employees-table-wrap').innerHTML = this.renderEmployeesTable(
          filtered.data
        );
        this.bindEmployeeView();
      }, 400);

      document.getElementById('emp-search').oninput = loadFiltered;
      document.getElementById('emp-dept-filter').onchange = loadFiltered;
      document.getElementById('emp-sort').onchange = loadFiltered;
      this.bindEmployeeView();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  renderEmployeesTable(employees) {
    if (!employees?.length) return '<div class="empty-state">No employees found</div>';
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Tasks</th>
              <th>Completed</th>
              <th>Completion</th>
              <th>Performance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${employees
              .map(
                (e) => `
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="avatar">${Utils.getInitials(e.name)}</div>
                    <div>
                      <strong>${Utils.escapeHtml(e.name)}</strong>
                      <small>${Utils.escapeHtml(e.email)}</small>
                    </div>
                  </div>
                </td>
                <td>${Utils.escapeHtml(e.department)}</td>
                <td>${e.stats?.totalTasks || 0}</td>
                <td>${e.stats?.completedTasks || 0}</td>
                <td>
                  <div class="inline-progress">${Charts.progressBar(e.stats?.completionRate || 0)}</div>
                </td>
                <td>
                  <div class="inline-progress">${Charts.progressBar(e.stats?.avgPerformanceScore || 0, 100, '#8b5cf6')}</div>
                </td>
                <td><button class="btn btn-sm btn-primary view-employee" data-id="${e._id}">View</button></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  bindEmployeeView() {
    document.querySelectorAll('.view-employee').forEach((btn) => {
      btn.onclick = () => this.showEmployeeModal(btn.dataset.id);
    });
  },

  async showEmployeeModal(id) {
    try {
      Loader.overlay(true);
      const res = await API.admin.employee(id);
      const { employee, stats, categoryBreakdown, recentTasks, topTasks, monthlyTrends } =
        res.data;

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const trendData = (monthlyTrends || []).map((m) => ({
        label: `${monthNames[m._id.month - 1]}`,
        value: m.completed,
      }));

      Modal.open({
        title: 'Employee Profile',
        size: 'lg',
        content: `
          <div class="employee-modal">
            <div class="emp-header">
              <div class="avatar avatar-lg">${Utils.getInitials(employee.name)}</div>
              <div>
                <h3>${Utils.escapeHtml(employee.name)}</h3>
                <p>${Utils.escapeHtml(employee.designation)} · ${Utils.escapeHtml(employee.department)}</p>
                <p class="text-muted">${Utils.escapeHtml(employee.email)}</p>
              </div>
              <div class="emp-score-badge">
                <span>${stats.avgPerformanceScore}</span>
                <small>Avg Score</small>
              </div>
            </div>

            <div class="kpi-grid kpi-grid-sm">
              <div class="mini-kpi"><span>Tasks</span><strong>${stats.totalTasks}</strong></div>
              <div class="mini-kpi"><span>Completed</span><strong>${stats.completedTasks}</strong></div>
              <div class="mini-kpi"><span>Pending</span><strong>${stats.pendingTasks}</strong></div>
              <div class="mini-kpi"><span>Completion</span><strong>${stats.completionRate}%</strong></div>
            </div>

            <div class="modal-charts-row">
              <div><h4>Monthly Trends</h4><div id="emp-trend-chart"></div></div>
              <div><h4>By Category</h4>
                <ul class="category-list">
                  ${(categoryBreakdown || []).map((c) => `<li><span>${Utils.escapeHtml(c.category)}</span><strong>${c.count} tasks · ${c.avgScore} avg</strong></li>`).join('') || '<li>No data</li>'}
                </ul>
              </div>
            </div>

            <h4>Recent Tasks</h4>
            <div class="mini-tasks">
              ${(recentTasks || []).slice(0, 5).map((t) => `<div class="mini-task"><span>${Utils.escapeHtml(t.title)}</span><span class="badge ${Utils.getStatusClass(t.status)}">${Utils.capitalize(t.status)}</span></div>`).join('') || '<p class="text-muted">No tasks</p>'}
            </div>

            <h4>Top Scoring Tasks</h4>
            <div class="mini-tasks">
              ${(topTasks || []).map((t) => `<div class="mini-task"><span>${Utils.escapeHtml(t.title)}</span><strong>${t.performanceScore} pts</strong></div>`).join('') || '<p class="text-muted">No scored tasks</p>'}
            </div>
          </div>
        `,
      });

      if (trendData.length) {
        Charts.barChart(document.getElementById('emp-trend-chart'), trendData, { color: '#22c55e', height: 120 });
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      Loader.overlay(false);
    }
  },

  async renderDepartments() {
    try {
      const res = await API.admin.departments();
      const depts = res.data || [];
      const container = document.getElementById('admin-tab-content');

      container.innerHTML = `
        <div class="dept-grid">
          ${depts
            .map(
              (d) => `
            <div class="dept-card card">
              <div class="dept-rank">#${d.rank}</div>
              <h3>${Utils.escapeHtml(d.department)}</h3>
              <div class="dept-stats">
                <div><span>Employees</span><strong>${d.employeeCount}</strong></div>
                <div><span>Tasks</span><strong>${d.totalTasks}</strong></div>
                <div><span>Completed</span><strong>${d.completedTasks}</strong></div>
              </div>
              <div class="dept-metrics">
                <div>
                  <label>Completion Rate</label>
                  ${Charts.progressBar(d.completionRate, 100, '#6366f1')}
                </div>
                <div>
                  <label>Avg Score</label>
                  <div class="score-display sm">${d.averageScore}</div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async renderLeaderboard() {
    try {
      const res = await API.admin.leaderboard();
      const { data: board, top3 } = res;

      document.getElementById('admin-tab-content').innerHTML = `
        <div class="podium">
          ${(top3 || [])
            .map(
              (e, i) => `
            <div class="podium-item podium-${i + 1}">
              <div class="podium-medal">${['🥇', '🥈', '🥉'][i]}</div>
              <div class="avatar avatar-lg">${Utils.getInitials(e.name)}</div>
              <strong>${Utils.escapeHtml(e.name)}</strong>
              <span>${Utils.escapeHtml(e.department)}</span>
              <div class="podium-score">${e.avgPerformanceScore} pts</div>
              <small>${e.completionRate}% completion</small>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="data-table leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Tasks</th>
                  <th>Completed</th>
                  <th>Performance</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                ${(board || [])
                  .map(
                    (e) => `
                  <tr class="${e.rank <= 3 ? 'top-row' : ''}">
                    <td><span class="rank-badge">${e.rank}</span></td>
                    <td>
                      <div class="user-cell">
                        <div class="avatar">${Utils.getInitials(e.name)}</div>
                        <strong>${Utils.escapeHtml(e.name)}</strong>
                      </div>
                    </td>
                    <td>${Utils.escapeHtml(e.department)}</td>
                    <td>${e.totalTasks}</td>
                    <td>${e.completedTasks}</td>
                    <td><div class="inline-progress">${Charts.progressBar(e.avgPerformanceScore, 100, '#8b5cf6')}</div></td>
                    <td><div class="inline-progress">${Charts.progressBar(e.completionRate)}</div></td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

window.AdminPage = AdminPage;
