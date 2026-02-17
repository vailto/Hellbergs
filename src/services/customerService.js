function getAdminToken(token) {
  const t = token?.trim() || window.prompt('ADMIN_TOKEN');
  if (!t) throw new Error('ADMIN_TOKEN krävs.');
  return t.trim();
}

export async function updateCustomerHasDmt({ id, hasDmt, token }) {
  if (!id) throw new Error('Kund-ID saknas.');
  const t = getAdminToken(token);
  const response = await fetch(`/api/customers/${encodeURIComponent(id)}/has-dmt`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify({ hasDmt: !!hasDmt }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte uppdatera DMT (${response.status}).`);
  }
  return response.json();
}
