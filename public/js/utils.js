const Utils = {
  formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  capitalize(str) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  },

  getInitials(name) {
    return (name || '?')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  getStatusClass(status) {
    const map = {
      pending: 'status-pending',
      in_progress: 'status-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    };
    return map[status] || 'status-pending';
  },

  getPriorityClass(priority) {
    const map = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
      urgent: 'priority-urgent',
    };
    return map[priority] || 'priority-medium';
  },

  isOverdue(task) {
    if (['completed', 'cancelled'].includes(task.status)) return false;
    return new Date(task.dueDate) < new Date();
  },

  getFileIcon(mimetype) {
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📝';
    if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return '📊';
    if (mimetype?.includes('image')) return '🖼️';
    if (mimetype?.includes('zip')) return '📦';
    return '📎';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

window.Utils = Utils;
