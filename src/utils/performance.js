/**
 * Evaluates task performance from progress, optional goals, and sub-tasks.
 * Returns 0–100 when at least one metric is present; otherwise null (keep manual score).
 */
function calculatePerformanceScore(task) {
  const components = [];

  if (typeof task.progress === 'number') {
    components.push({ weight: 0.25, value: Math.min(100, Math.max(0, task.progress)) });
  }

  const goalTarget = task.goalTarget;
  if (goalTarget != null && goalTarget > 0) {
    const achieved = Math.max(0, task.goalsAchieved || 0);
    const goalPct = Math.min(100, (achieved / goalTarget) * 100);
    components.push({ weight: 0.45, value: goalPct });
  }

  const subTasks = task.subTasks || [];
  if (subTasks.length > 0) {
    const done = subTasks.filter((s) => s.completed || s.status === 'completed').length;
    const subPct = (done / subTasks.length) * 100;
    components.push({ weight: 0.3, value: subPct });
  }

  if (components.length === 0) return null;

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const score = components.reduce((sum, c) => sum + c.value * c.weight, 0) / totalWeight;
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

function deriveProgressFromSubtasks(task) {
  const subTasks = task.subTasks || [];
  if (subTasks.length === 0) return task.progress;
  const done = subTasks.filter((s) => s.completed || s.status === 'completed').length;
  return Math.round((done / subTasks.length) * 100);
}

function applyTaskMetrics(task) {
  if (task.subTasks?.length > 0 && (task.progress == null || task._syncProgressFromSubtasks)) {
    task.progress = deriveProgressFromSubtasks(task);
  }
  const computed = calculatePerformanceScore(task);
  if (computed !== null) {
    task.performanceScore = computed;
  }
  return task;
}

function normalizeTaskPayload(body) {
  const data = { ...body };

  if (data.urls !== undefined) {
    data.urls = Array.isArray(data.urls)
      ? data.urls
          .filter((u) => u && (u.url || u.label))
          .map((u) => ({
            label: (u.label || '').trim(),
            url: (u.url || '').trim(),
          }))
          .filter((u) => u.url)
      : [];
  }

  if (data.subTasks !== undefined) {
    data.subTasks = Array.isArray(data.subTasks)
      ? data.subTasks
          .filter((s) => s && s.title?.trim())
          .map((s) => ({
            title: s.title.trim(),
            completed: Boolean(s.completed),
            status: s.completed || s.status === 'completed' ? 'completed' : 'pending',
          }))
      : [];
  }

  if (data.goalTarget === '' || data.goalTarget === null || data.goalTarget === undefined) {
    data.goalTarget = null;
    data.goalsAchieved = data.goalsAchieved || 0;
  } else {
    data.goalTarget = Math.max(0, parseInt(data.goalTarget, 10) || 0);
    data.goalsAchieved = Math.max(0, parseInt(data.goalsAchieved, 10) || 0);
    if (data.goalTarget === 0) {
      data.goalTarget = null;
    }
  }

  return data;
}

module.exports = {
  calculatePerformanceScore,
  deriveProgressFromSubtasks,
  applyTaskMetrics,
  normalizeTaskPayload,
};
