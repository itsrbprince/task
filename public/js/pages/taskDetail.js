const TaskDetailPage = {
  taskId: null,
  task: null,

  async render(id) {
    this.taskId = id;
    Loader.show();
    try {
      const res = await API.tasks.get(id);
      this.task = res.data;
      document.getElementById('app-content').innerHTML = this.buildHTML();
      this.bindEvents();
    } catch (err) {
      Toast.error(err.message);
      App.navigate('#/tasks');
    }
  },

  buildHTML() {
    const t = this.task;
    const user = API.getUser();
    return `
      <div class="page-header">
        <div>
          <a href="#/tasks" class="back-link">← Back to Tasks</a>
          <h1>${Utils.escapeHtml(t.title)}</h1>
          <div class="task-meta">
            <span class="badge ${Utils.getPriorityClass(t.priority)}">${Utils.capitalize(t.priority)}</span>
            <span class="badge ${Utils.getStatusClass(t.status)}">${Utils.capitalize(t.status)}</span>
            ${Utils.isOverdue(t) ? '<span class="badge priority-urgent">Overdue</span>' : ''}
          </div>
        </div>
        <button class="btn btn-primary" onclick="TasksPage.openTaskModal('${t._id}')">Edit Task</button>
      </div>

      <div class="detail-grid">
        <div class="detail-main">
          <div class="card">
            <h3>Description</h3>
            <p>${Utils.escapeHtml(t.description || 'No description provided.')}</p>
          </div>

          ${
            t.goalTarget
              ? `
          <div class="card">
            <h3>Goals</h3>
            <div class="goal-stats">
              <div class="goal-ring">
                <strong>${t.goalsAchieved || 0}</strong>
                <span>of ${t.goalTarget} target</span>
              </div>
              ${Charts.progressBar(Math.min(100, ((t.goalsAchieved || 0) / t.goalTarget) * 100), 100, '#22c55e')}
              <form id="goal-update-form" class="goal-update-form">
                <label>Update goals achieved</label>
                <div class="form-row-inline">
                  <input type="number" name="goalsAchieved" min="0" max="${t.goalTarget * 2}" value="${t.goalsAchieved || 0}" />
                  <button type="submit" class="btn btn-sm btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>`
              : ''
          }

          ${
            t.subTasks?.length
              ? `
          <div class="card">
            <h3>Sub-tasks (${t.subTasks.filter((s) => s.completed || s.status === 'completed').length}/${t.subTasks.length})</h3>
            <ul class="subtask-list">
              ${t.subTasks
                .map(
                  (s) => `
                <li class="${s.completed || s.status === 'completed' ? 'done' : ''}">
                  <span>${s.completed || s.status === 'completed' ? '✓' : '○'}</span>
                  ${Utils.escapeHtml(s.title)}
                </li>
              `
                )
                .join('')}
            </ul>
          </div>`
              : ''
          }

          ${
            t.urls?.length
              ? `
          <div class="card">
            <h3>Links</h3>
            <ul class="url-list">
              ${t.urls
                .map(
                  (u) => `
                <li>
                  <a href="${Utils.escapeHtml(u.url)}" target="_blank" rel="noopener">${Utils.escapeHtml(u.label || u.url)}</a>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>`
              : ''
          }

          <div class="card">
            <h3>Progress & Performance</h3>
            <div class="detail-stats">
              <div>
                <label>Progress</label>
                ${Charts.progressBar(t.progress || 0)}
              </div>
              <div>
                <label>Performance Score ${t.goalTarget || t.subTasks?.length ? '<span class="optional-tag">(evaluated)</span>' : ''}</label>
                <div class="score-display">${t.performanceScore || 0}<span>/100</span></div>
              </div>
            </div>
            ${
              user.role === 'employee'
                ? `
            <div class="quick-update mt-4">
              <label>Quick Status Update</label>
              <div class="btn-group">
                <button class="btn btn-sm" data-status="pending">Pending</button>
                <button class="btn btn-sm" data-status="in_progress">In Progress</button>
                <button class="btn btn-sm" data-status="completed">Completed</button>
              </div>
              <input type="range" id="progress-slider" min="0" max="100" value="${t.progress || 0}" />
              <span id="progress-value">${t.progress || 0}%</span>
              <button class="btn btn-primary btn-sm" id="save-progress">Save Progress</button>
            </div>`
                : ''
            }
          </div>

          <div class="card">
            <h3>Comments (${t.comments?.length || 0})</h3>
            <div class="comments-list" id="comments-list">
              ${(t.comments || [])
                .map(
                  (c) => `
                <div class="comment">
                  <div class="comment-avatar">${Utils.getInitials(c.author?.name)}</div>
                  <div class="comment-body">
                    <strong>${Utils.escapeHtml(c.author?.name || 'User')}</strong>
                    <span class="comment-time">${Utils.formatDateTime(c.createdAt)}</span>
                    <p>${Utils.escapeHtml(c.text)}</p>
                  </div>
                </div>
              `
                )
                .join('') || '<p class="text-muted">No comments yet</p>'}
            </div>
            <form id="comment-form" class="comment-form">
              <textarea placeholder="Add a comment..." required rows="2"></textarea>
              <button type="submit" class="btn btn-primary btn-sm">Post</button>
            </form>
          </div>
        </div>

        <div class="detail-sidebar">
          <div class="card">
            <h3>Details</h3>
            <dl class="detail-list">
              <dt>Assignee</dt><dd>${Utils.escapeHtml(t.assignedTo?.name)}</dd>
              <dt>Assigned By</dt><dd>${Utils.escapeHtml(t.assignedBy?.name)}</dd>
              <dt>Category</dt><dd>${Utils.escapeHtml(t.category)}</dd>
              <dt>Due Date</dt><dd>${Utils.formatDate(t.dueDate)}</dd>
              <dt>Created</dt><dd>${Utils.formatDate(t.createdAt)}</dd>
            </dl>
          </div>

          <div class="card">
            <h3>Attachments (${t.attachments?.length || 0})</h3>
            <div class="drop-zone" id="drop-zone">
              <div class="drop-zone-content">
                <span class="drop-icon">📁</span>
                <p>Drag & drop files here or <label class="file-label">browse<input type="file" id="file-input" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip" hidden /></label></p>
                <small>PDF, DOCX, XLSX, JPG, PNG, ZIP — Max 10 files, 20MB each</small>
              </div>
            </div>
            <div id="attachments-list" class="attachments-list">
              ${this.renderAttachments(t.attachments || [])}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderAttachments(attachments) {
    if (!attachments.length) return '<p class="text-muted">No attachments</p>';
    return attachments
      .map(
        (a) => `
      <div class="attachment-item" data-id="${a._id}">
        <span class="attachment-icon">${Utils.getFileIcon(a.mimetype)}</span>
        <div class="attachment-info">
          <strong>${Utils.escapeHtml(a.originalName)}</strong>
          <small>${Utils.formatFileSize(a.size)} · ${Utils.formatDate(a.uploadedAt)}</small>
        </div>
        <div class="attachment-actions">
          <button class="btn btn-sm btn-ghost" onclick="TaskDetailPage.downloadFile('${a.filename}', '${Utils.escapeHtml(a.originalName).replace(/'/g, "\\'")}')">Download</button>
          <button class="btn btn-sm btn-danger-ghost" onclick="TaskDetailPage.deleteAttachment('${a._id}')">Delete</button>
        </div>
      </div>
    `
      )
      .join('');
  },

  bindEvents() {
    const slider = document.getElementById('progress-slider');
    const valueEl = document.getElementById('progress-value');
    slider?.addEventListener('input', () => {
      valueEl.textContent = `${slider.value}%`;
    });

    document.getElementById('save-progress')?.addEventListener('click', async () => {
      try {
        await API.tasks.update(this.taskId, {
          progress: parseInt(slider.value, 10),
          status: parseInt(slider.value, 10) === 100 ? 'completed' : 'in_progress',
        });
        Toast.success('Progress saved');
        this.render(this.taskId);
      } catch (err) {
        Toast.error(err.message);
      }
    });

    document.querySelectorAll('[data-status]').forEach((btn) => {
      btn.onclick = async () => {
        try {
          await API.tasks.update(this.taskId, { status: btn.dataset.status });
          Toast.success('Status updated');
          this.render(this.taskId);
        } catch (err) {
          Toast.error(err.message);
        }
      };
    });

    document.getElementById('goal-update-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = parseInt(e.target.goalsAchieved.value, 10) || 0;
      try {
        await API.tasks.update(this.taskId, { goalsAchieved: val });
        Toast.success('Goals updated — performance recalculated');
        this.render(this.taskId);
      } catch (err) {
        Toast.error(err.message);
      }
    });

    document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = e.target.querySelector('textarea');
      try {
        await API.tasks.addComment(this.taskId, textarea.value);
        textarea.value = '';
        Toast.success('Comment added');
        this.render(this.taskId);
      } catch (err) {
        Toast.error(err.message);
      }
    });

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    ['dragenter', 'dragover'].forEach((ev) => {
      dropZone?.addEventListener(ev, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      dropZone?.addEventListener(ev, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone?.addEventListener('drop', (e) => {
      this.uploadFiles(e.dataTransfer.files);
    });
    fileInput?.addEventListener('change', () => {
      this.uploadFiles(fileInput.files);
      fileInput.value = '';
    });
  },

  async uploadFiles(fileList) {
    if (!fileList?.length) return;
    const formData = new FormData();
    Array.from(fileList)
      .slice(0, 10)
      .forEach((f) => formData.append('files', f));

    try {
      Loader.overlay(true);
      await API.tasks.uploadAttachments(this.taskId, formData);
      Toast.success('Files uploaded');
      this.render(this.taskId);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      Loader.overlay(false);
    }
  },

  async downloadFile(filename, originalName) {
    try {
      const res = await fetch(`${API.baseURL}/tasks/uploads/${filename}`, {
        headers: API.tasks.getDownloadHeaders(),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteAttachment(attachmentId) {
    if (!confirm('Delete this attachment?')) return;
    try {
      await API.tasks.deleteAttachment(this.taskId, attachmentId);
      Toast.success('Attachment deleted');
      this.render(this.taskId);
    } catch (err) {
      Toast.error(err.message);
    }
  },
};

window.TaskDetailPage = TaskDetailPage;
