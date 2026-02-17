const API_BASE = '/api/admin';

export async function seedMasterdata({ token }) {
  const response = await fetch(`${API_BASE}/seed/masterdata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const msg =
      response.status === 401
        ? 'Invalid token'
        : await response.text().catch(() => response.statusText);
    throw new Error(msg || `Request failed: ${response.status}`);
  }
  return response.json();
}
