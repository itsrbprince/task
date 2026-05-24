const Charts = {
  barChart(container, data, options = {}) {
    const { labelKey = 'label', valueKey = 'value', color = '#6366f1', height = 200 } = options;
    const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

    container.innerHTML = `
      <div class="chart-bar" style="height:${height}px">
        ${data
          .map(
            (d) => `
          <div class="chart-bar-item">
            <div class="chart-bar-fill" style="height:${((d[valueKey] || 0) / max) * 100}%; background:${color}">
              <span class="chart-bar-value">${d[valueKey] || 0}</span>
            </div>
            <span class="chart-bar-label">${Utils.escapeHtml(d[labelKey] || '')}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  },

  multiBarChart(container, data, options = {}) {
    const { labelKey = 'label', keys = [], colors = ['#6366f1', '#22c55e'], height = 220 } = options;
    const max = Math.max(
      ...data.flatMap((d) => keys.map((k) => d[k] || 0)),
      1
    );

    container.innerHTML = `
      <div class="chart-multi-bar" style="height:${height}px">
        ${data
          .map(
            (d) => `
          <div class="chart-bar-group">
            <div class="chart-bars-stack">
              ${keys
                .map(
                  (k, i) => `
                <div class="chart-bar-fill" style="height:${((d[k] || 0) / max) * 100}%; background:${colors[i % colors.length]}" title="${k}: ${d[k]}"></div>
              `
                )
                .join('')}
            </div>
            <span class="chart-bar-label">${Utils.escapeHtml(d[labelKey] || '')}</span>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="chart-legend">
        ${keys.map((k, i) => `<span><i style="background:${colors[i]}"></i>${Utils.capitalize(k)}</span>`).join('')}
      </div>
    `;
  },

  donutChart(container, data, options = {}) {
    const { labelKey = 'label', valueKey = 'value' } = options;
    const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1;
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4'];
    let offset = 0;
    const circumference = 2 * Math.PI * 40;

    const segments = data
      .map((d, i) => {
        const pct = (d[valueKey] || 0) / total;
        const dash = pct * circumference;
        const seg = `<circle cx="50" cy="50" r="40" fill="none" stroke="${colors[i % colors.length]}" 
          stroke-width="12" stroke-dasharray="${dash} ${circumference}" 
          stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
        offset += dash;
        return seg;
      })
      .join('');

    container.innerHTML = `
      <div class="chart-donut-wrap">
        <svg viewBox="0 0 100 100" class="chart-donut">${segments}</svg>
        <div class="chart-donut-center"><strong>${total}</strong><span>Total</span></div>
      </div>
      <div class="chart-legend vertical">
        ${data
          .map(
            (d, i) =>
              `<span><i style="background:${colors[i % colors.length]}"></i>${Utils.escapeHtml(d[labelKey])}: ${d[valueKey]}</span>`
          )
          .join('')}
      </div>
    `;
  },

  progressBar(value, max = 100, color) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%; ${color ? `background:${color}` : ''}"></div>
      </div>
      <span class="progress-text">${pct}%</span>
    `;
  },
};

window.Charts = Charts;
