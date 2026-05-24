const TaskForm = {
  renderUrls(urls = []) {
    const items = urls.length ? urls : [{ label: '', url: '' }];
    return `
      <div class="form-section">
        <div class="section-header">
          <label>Links / URLs</label>
          <button type="button" class="btn btn-sm btn-ghost" data-add="url">+ Add URL</button>
        </div>
        <div id="urls-list" class="dynamic-list">
          ${items.map((u, i) => this.urlRow(u, i)).join('')}
        </div>
      </div>
    `;
  },

  urlRow(u = {}, index = 0) {
    return `
      <div class="dynamic-row" data-type="url">
        <input type="text" placeholder="Label (optional)" data-field="label" value="${Utils.escapeHtml(u.label || '')}" />
        <input type="url" placeholder="https://..." data-field="url" value="${Utils.escapeHtml(u.url || '')}" />
        <button type="button" class="btn btn-sm btn-danger-ghost" data-remove-row>&times;</button>
      </div>
    `;
  },

  renderSubTasks(subTasks = []) {
    const items = subTasks.length ? subTasks : [];
    return `
      <div class="form-section">
        <div class="section-header">
          <label>Sub-tasks</label>
          <button type="button" class="btn btn-sm btn-ghost" data-add="subtask">+ Add Sub-task</button>
        </div>
        <div id="subtasks-list" class="dynamic-list">
          ${items.length ? items.map((s, i) => this.subTaskRow(s, i)).join('') : '<p class="text-muted empty-hint">No sub-tasks yet. Click + Add Sub-task.</p>'}
        </div>
      </div>
    `;
  },

  subTaskRow(s = {}, index = 0) {
    const done = s.completed || s.status === 'completed';
    return `
      <div class="dynamic-row" data-type="subtask">
        <input type="checkbox" data-field="completed" ${done ? 'checked' : ''} title="Completed" />
        <input type="text" placeholder="Sub-task title" data-field="title" value="${Utils.escapeHtml(s.title || '')}" required />
        <button type="button" class="btn btn-sm btn-danger-ghost" data-remove-row>&times;</button>
      </div>
    `;
  },

  renderGoals(task = {}) {
    const hasGoal = task.goalTarget != null && task.goalTarget > 0;
    return `
      <div class="form-section goals-section">
        <div class="section-header">
          <label>
            <input type="checkbox" id="enable-goal" ${hasGoal ? 'checked' : ''} />
            Daily / target goals <span class="optional-tag">(optional)</span>
          </label>
        </div>
        <div id="goals-fields" class="${hasGoal ? '' : 'hidden'}">
          <div class="form-row">
            <div class="form-group">
              <label>Target (e.g. 100)</label>
              <input type="number" name="goalTarget" min="1" placeholder="100" value="${hasGoal ? task.goalTarget : ''}" />
            </div>
            <div class="form-group">
              <label>Goals achieved</label>
              <input type="number" name="goalsAchieved" min="0" value="${task.goalsAchieved ?? 0}" />
            </div>
          </div>
          <p class="form-hint">Performance score is auto-calculated from goals, sub-tasks, and progress when set.</p>
        </div>
      </div>
    `;
  },

  bind(container) {
    container.querySelector('[data-add="url"]')?.addEventListener('click', () => {
      const list = container.querySelector('#urls-list');
      list.insertAdjacentHTML('beforeend', this.urlRow());
    });

    container.querySelector('[data-add="subtask"]')?.addEventListener('click', () => {
      const list = container.querySelector('#subtasks-list');
      const hint = list.querySelector('.empty-hint');
      if (hint) hint.remove();
      list.insertAdjacentHTML('beforeend', this.subTaskRow());
    });

    container.querySelector('#enable-goal')?.addEventListener('change', (e) => {
      const fields = container.querySelector('#goals-fields');
      fields?.classList.toggle('hidden', !e.target.checked);
      if (!e.target.checked) {
        const gt = fields?.querySelector('[name="goalTarget"]');
        const ga = fields?.querySelector('[name="goalsAchieved"]');
        if (gt) gt.value = '';
        if (ga) ga.value = '0';
      }
    });

    container.addEventListener('click', (e) => {
      if (e.target.matches('[data-remove-row]')) {
        e.target.closest('.dynamic-row')?.remove();
      }
    });
  },

  collect(container) {
    const urls = [];
    container.querySelectorAll('[data-type="url"]').forEach((row) => {
      const url = row.querySelector('[data-field="url"]')?.value?.trim();
      const label = row.querySelector('[data-field="label"]')?.value?.trim();
      if (url) urls.push({ label, url });
    });

    const subTasks = [];
    container.querySelectorAll('[data-type="subtask"]').forEach((row) => {
      const title = row.querySelector('[data-field="title"]')?.value?.trim();
      const completed = row.querySelector('[data-field="completed"]')?.checked;
      if (title) subTasks.push({ title, completed, status: completed ? 'completed' : 'pending' });
    });

    const enableGoal = container.querySelector('#enable-goal')?.checked;
    let goalTarget = null;
    let goalsAchieved = 0;
    if (enableGoal) {
      const gt = container.querySelector('[name="goalTarget"]')?.value;
      goalTarget = gt ? parseInt(gt, 10) : null;
      goalsAchieved = parseInt(container.querySelector('[name="goalsAchieved"]')?.value, 10) || 0;
    }

    return { urls, subTasks, goalTarget, goalsAchieved };
  },
};

window.TaskForm = TaskForm;
