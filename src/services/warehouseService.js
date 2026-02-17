const API_BASE = '/api/warehouse';

function getAdminToken(token) {
  const t = token?.trim() || window.prompt('ADMIN_TOKEN');
  if (!t) throw new Error('Token krävs för lagerooperationer.');
  return t.trim();
}

export async function fetchWarehouse() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchStorageInvoiceLine({ itemId, toDate, token }) {
  const t = getAdminToken(token);
  const today = new Date().toISOString().slice(0, 10);
  const qs =
    toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)
      ? `?toDate=${encodeURIComponent(toDate)}`
      : `?toDate=${today}`;
  const response = await fetch(
    `${API_BASE}/items/${encodeURIComponent(itemId)}/storage-invoice-line${qs}`,
    { headers: { Authorization: `Bearer ${t}` } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte hämta fakturarad (${response.status}).`);
  }
  return response.json();
}
