const TOKEN_KEY = 'docmind_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { ...options, headers, body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // An expired session while signed in sends the person back to the sign-in screen
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('docmind:logout'));
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
