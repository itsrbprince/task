const Modal = {
  open({ title, content, size = 'md', onClose, footer }) {
    this.close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.innerHTML = `
      <div class="modal modal-${size}">
        <div class="modal-header">
          <h2>${title || ''}</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">${content || ''}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
      if (onClose) onClose();
    };

    overlay.querySelector('.modal-close').onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', esc);
      }
    });

    return { close, element: overlay };
  },

  close() {
    const modal = document.getElementById('active-modal');
    if (modal) modal.remove();
  },
};

window.Modal = Modal;
