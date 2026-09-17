async function request(path, body) {
  let response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Request': '1' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || 'The request failed. Please try again.');
    error.status = response.status;
    throw error;
  }
  if (!data?.id) throw new Error('Unexpected server response. Please try again.');
  return data;
}

export const authService = {
  signup: (details) => request('signup', details),
  login: (details) => request('login', details),
  logout: () => request('logout', {}),
  currentUser: async () => {
    try { return await request('me'); }
    catch (error) {
      if (error.status === 401) return null;
      throw error;
    }
  },
};
