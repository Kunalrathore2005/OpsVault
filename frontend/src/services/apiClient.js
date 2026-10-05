import {mock} from './mockApi';
const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
let access = localStorage.getItem('ops_access'), refresh = localStorage.getItem('ops_refresh');

export const session = {
  set(t) {
    access = t.access_token;
    refresh = t.refresh_token;
    localStorage.setItem('ops_access', access);
    localStorage.setItem('ops_refresh', refresh);
  },
  clear() {
    access = refresh = null;
    localStorage.removeItem('ops_access');
    localStorage.removeItem('ops_refresh');
  }
};

export async function api(path, {method = 'GET', body, form = false} = {}) {
  if (import.meta.env.VITE_USE_MOCKS === 'true') return mock(path, {method, body});
  
  const run = async () => fetch(BASE + path, {
    method,
    headers: {
      ...(form ? {} : {'Content-Type': 'application/json'}),
      ...(access ? {Authorization: `Bearer ${access}`} : {})
    },
    body: body ? (form ? body : JSON.stringify(body)) : undefined
  });

  let r = await run();
  if (r.status === 401 && refresh) {
    const rr = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refresh_token: refresh})
    });
    if (rr.ok) {
      session.set(await rr.json());
      r = await run();
    } else {
      session.clear();
    }
  }

  if (!r.ok) {
    const e = await r.json().catch(() => ({detail: 'Network or server error'}));
    throw new Error(e.detail || 'Request failed');
  }

  return r.status === 204 ? null : r.json();
}
