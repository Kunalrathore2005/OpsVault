import {api, session} from './apiClient';

export const authService = {
  login: async ({email, password}) => {
    const t = await api('/auth/login', {method: 'POST', body: {email: email.trim(), password}});
    session.set(t);
    return t;
  },
  logout: () => {
    session.clear();
    return api('/auth/logout', {method: 'POST'});
  },
  register: data => api('/auth/register', {method: 'POST', body: data})
};

const crud = (route) => ({
  list: () => api(route),
  create: d => api(route, {method: 'POST', body: d}),
  update: (id, d) => api(`${route}/${id}`, {method: 'PATCH', body: d}),
  remove: id => api(`${route}/${id}`, {method: 'DELETE'})
});

export const userService = crud('/users');

export const departmentService = {
  ...crud('/departments'),
  assignEmployee: (deptId, userId) => api(`/departments/${deptId}/employees`, {method: 'POST', body: {user_id: userId}}),
  removeEmployee: (deptId, userId) => api(`/departments/${deptId}/employees/${userId}`, {method: 'DELETE'})
};

export const taskService = {
  ...crud('/tasks'),
  get: id => api(`/tasks/${id}`)
};

export const approvalService = {
  ...crud('/approvals'),
  decide: (id, d) => api(`/approvals/${id}/decision`, {method: 'POST', body: d})
};

export const notificationService = {
  ...crud('/notifications'),
  read: id => api(`/notifications/${id}/read`, {method: 'POST'})
};

export const profileService = {
  get: () => api('/profile'),
  history: () => api('/profile/xp-history')
};

export const incidentService = crud('/incidents');
export const assetService = crud('/assets');

export const documentService = {
  list: () => api('/documents'),
  upload: (file, departmentId) => {
    const body = new FormData();
    body.append('file', file);
    if (departmentId) body.append('department_id', departmentId);
    return api('/documents', {method: 'POST', body, form: true});
  },
  download: async (id, filename) => {
    const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const access = localStorage.getItem('ops_access');
    const res = await fetch(`${BASE}/documents/${id}/download`, {
      headers: access ? { Authorization: `Bearer ${access}` } : {}
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  remove: id => api(`/documents/${id}`, {method: 'DELETE'})
};

export const collaborationService = {
  list: taskId => api(`/tasks/${taskId}/collaborations`),
  request: (taskId, invitee_id) => api(`/tasks/${taskId}/collaborations`, {method: 'POST', body: {invitee_id}}),
  respond: (id, accepted) => api(`/collaborations/${id}/respond?accepted=${accepted}`, {method: 'POST'})
};

export const automationService = {
  ...crud('/automations'),
  toggle: id => api(`/automations/${id}/toggle`, {method: 'POST'}),
  executions: id => api(`/automations/${id}/executions`)
};

export const escalationService = {
  ...crud('/escalations'),
  resolve: (id, note) => api(`/escalations/${id}/resolve`, {method: 'POST', body: {resolution_note: note}})
};

export const reportService = {
  types: () => api('/reports/types'),
  history: () => api('/reports/history'),
  generate: data => api('/reports/generate', {method: 'POST', body: data}),
  download: async (executionId, filename) => {
    const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const access = localStorage.getItem('ops_access');
    const res = await fetch(`${BASE}/reports/download?execution_id=${executionId}`, {
      headers: access ? { Authorization: `Bearer ${access}` } : {}
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `report_${executionId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const reportScheduleService = {
  ...crud('/report-schedules'),
  runNow: id => api(`/report-schedules/${id}/run`, {method: 'POST'})
};

export const calendarService = {
  list: (startDate, endDate) => {
    let q = '';
    const params = [];
    if (startDate) params.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`end_date=${encodeURIComponent(endDate)}`);
    if (params.length) q = `?${params.join('&')}`;
    return api(`/calendar/events${q}`);
  },
  create: d => api('/calendar/events', {method: 'POST', body: d}),
  update: (id, d) => api(`/calendar/events/${id}`, {method: 'PATCH', body: d}),
  remove: id => api(`/calendar/events/${id}`, {method: 'DELETE'})
};

export const slaService = {
  summary: () => api('/sla/summary')
};

export const commentService = {
  list: (targetType, targetId) => api(`/comments/${targetType}/${targetId}`),
  create: (targetType, targetId, data) => api(`/comments/${targetType}/${targetId}`, { method: 'POST', body: data })
};

export const searchService = {
  query: q => api(`/search?q=${encodeURIComponent(q)}`)
};



