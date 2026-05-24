const TasksPage = {
  filters: { search: '', status: '', priority: '', page: 1 },

  async render() {
    Loader.show();
    try {
      const params = { ...this.filters, limit: 15 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await API.tasks.list(params);
      const tasks = res.data || [];
      const pagination = res.pagination || {};

      document.getElementById('app-content').innerHTML = `
        <div class="page-header">
          <div>
            <h1>My Tasks</h1>
            <p>Manage and track your assigned tasks</p>
          </div>
          <button class="btn btn-primary" onclick="TasksPage.openTaskModal()">+ Create Task</button>
        </div>

        <div class="filters-bar card">
          <input type="search" id="task-search" placeholder="Search tasks..." value="${this.filters.search}" />
          <select id="filter-status">
            <option value="">All Status</option>
            <option value="pending" ${this.filters.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in_progress" ${this.filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${this.filters.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
          <select id="filter-priority">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <label class="checkbox-label">
            <input type="checkbox" id="filter-overdue" ${this.filters.overdue ? 'checked' : ''} /> Overdue only
          </label>
        </div>

        <div class="card">
          ${tasks.length ? this.renderTable(tasks) : '<div class="empty-state"><div class="empty-icon">📋</div><h3>No tasks found</h3><p>Create a new task or adjust filters</p></div>'}
          ${this.renderPagination(pagination)}
        </div>
      `;

      this.bindFilters();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  renderTable(tasks) {
    const user = API.getUser();
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Score</th>
              <th>Due Date</th>
              ${user.role === 'admin' ? '<th>Assignee</th>' : ''}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr class="${Utils.isOverdue(t) ? 'row-overdue' : ''}">
                <td><strong>${Utils.escapeHtml(t.title)}</strong></td>
                <td>${Utils.escapeHtml(t.category)}</td>
                <td><span class="badge ${Utils.getPriorityClass(t.priority)}">${Utils.capitalize(t.priority)}</span></td>
                <td><span class="badge ${Utils.getStatusClass(t.status)}">${Utils.capitalize(t.status)}</span></td>
                <td>${Charts.progressBar(t.progress || 0)}</td>
                <td>${t.performanceScore || '—'}</td>
                <td>${Utils.formatDate(t.dueDate)}</td>
                ${user.role === 'admin' ? `<td>${Utils.escapeHtml(t.assignedTo?.name || '')}</td>` : ''}
                <td class="actions-cell">
                  <button class="btn btn-sm btn-ghost" onclick="App.navigate('#/tasks/${t._id}')">View</button>
                  <button class="btn btn-sm btn-ghost" onclick="TasksPage.openTaskModal('${t._id}')">Edit</button>
                  ${user.role === 'admin' ? `<button class="btn btn-sm btn-danger-ghost" onclick="TasksPage.deleteTask('${t._id}')">Delete</button>` : ''}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderPagination(p) {
    if (!p.pages || p.pages <= 1) return '';
    let html = '<div class="pagination">';
    for (let i = 1; i <= p.pages; i++) {
      html += `<button class="btn btn-sm ${i === p.page ? 'btn-primary' : 'btn-ghost'}" data-page="${i}">${i}</button>`;
    }
    html += '</div>';
    return html;
  },

  bindFilters() {
    const search = document.getElementById('task-search');
    const status = document.getElementById('filter-status');
    const priority = document.getElementById('filter-priority');
    const overdue = document.getElementById('filter-overdue');

    const apply = Utils.debounce(() => {
      this.filters.search = search?.value || '';
      this.filters.status = status?.value || '';
      this.filters.priority = priority?.value || '';
      this.filters.overdue = overdue?.checked ? 'true' : '';
      this.filters.page = 1;
      this.render();
    }, 400);

    search?.addEventListener('input', apply);
    status?.addEventListener('change', apply);
    priority?.addEventListener('change', apply);
    overdue?.addEventListener('change', apply);

    document.querySelectorAll('.pagination button').forEach((btn) => {
      btn.onclick = () => {
        this.filters.page = parseInt(btn.dataset.page, 10);
        this.render();
      };
    });
  },

  async openTaskModal(taskId = null) {
    let task = null;
    let employees = [];

    try {
      if (taskId) {
        const res = await API.tasks.get(taskId);
        task = res.data;
      }
      if (API.getUser().role === 'admin') {
        const empRes = await API.auth.getEmployees();
        employees = empRes.data || [];
      }
    } catch (err) {
      Toast.error(err.message);
      return;
    }

    const user = API.getUser();
    const content = `
      <form id="task-form" class="task-form-extended">
        <div class="form-group">
          <label>Title *</label>
          <input name="title" required value="${Utils.escapeHtml(task?.title || '')}" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" rows="2">${Utils.escapeHtml(task?.description || '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              ${['low', 'medium', 'high', 'urgent']
                .map(
                  (p) =>
                    `<option value="${p}" ${task?.priority === p ? 'selected' : ''}>${Utils.capitalize(p)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input name="category" value="${Utils.escapeHtml(task?.category || 'General')}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Due Date *</label>
            <input type="date" name="dueDate" required value="${task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}" />
          </div>
          ${
            user.role === 'admin'
              ? `<div class="form-group">
            <label>Assign To *</label>
            <select name="assignedTo" required>
              ${employees.map((e) => `<option value="${e._id}" ${task?.assignedTo?._id === e._id || task?.assignedTo === e._id ? 'selected' : ''}>${Utils.escapeHtml(e.name)}</option>`).join('')}
            </select>
          </div>`
              : `<input type="hidden" name="assignedTo" value="${user.id || user._id}" />`
          }
        </div>
        ${TaskForm.renderSubTasks(task?.subTasks || [])}
        ${TaskForm.renderUrls(task?.urls || [])}
        ${TaskForm.renderGoals(task || {})}
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              ${['pending', 'in_progress', 'completed', 'cancelled']
                .map(
                  (s) =>
                    `<option value="${s}" ${(task?.status || 'pending') === s ? 'selected' : ''}>${Utils.capitalize(s)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Progress (%)</label>
            <input type="number" name="progress" min="0" max="100" value="${task?.progress || 0}" />
          </div>
          ${
            user.role === 'admin' && task
              ? `<div class="form-group">
            <label>Performance Score <span class="optional-tag">(auto if goals/sub-tasks set)</span></label>
            <input type="number" name="performanceScore" min="0" max="100" value="${task.performanceScore || 0}" />
          </div>`
              : ''
          }
        </div>
        ${task?.performanceScore != null && (task.goalTarget || task.subTasks?.length) ? `<p class="form-hint perf-preview">Evaluated performance: <strong>${task.performanceScore}</strong>/100</p>` : ''}
      </form>
    `;

    const modal = Modal.open({
      title: task ? 'Edit Task' : 'Create Task',
      size: 'lg',
      content,
      footer: `
        <button class="btn btn-ghost modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-task-btn">${task ? 'Update' : 'Create'}</button>
      `,
    });

    TaskForm.bind(modal.element);
    modal.element.querySelector('#enable-goal')?.addEventListener('change', (e) => {
      modal.element.querySelector('#goals-fields')?.classList.toggle('hidden', !e.target.checked);
    });

    modal.element.querySelector('.modal-cancel').onclick = () => modal.close();
    modal.element.querySelector('#save-task-btn').onclick = async () => {
      const form = document.getElementById('task-form');
      const body = Object.fromEntries(new FormData(form));
      const extra = TaskForm.collect(modal.element);
      Object.assign(body, extra);
      body.progress = parseInt(body.progress, 10) || 0;
      if (body.performanceScore !== undefined) {
        body.performanceScore = parseInt(body.performanceScore, 10) || 0;
      }
      if (!body.assignedTo) body.assignedTo = user.id || user._id;

      try {
        Loader.overlay(true);
        if (task) await API.tasks.update(task._id, body);
        else await API.tasks.create(body);
        Toast.success(task ? 'Task updated' : 'Task created');
        modal.close();
        this.render();
      } catch (err) {
        Toast.error(err.message);
      } finally {
        Loader.overlay(false);
      }
    };
  },

  async deleteTask(id) {
    if (!confirm('Delete this task permanently?')) return;
    try {
      await API.tasks.delete(id);
      Toast.success('Task deleted');
      this.render();
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

window.TasksPage = TasksPage;
