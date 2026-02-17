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

export async function createWarehouseItem({
  customerId,
  description,
  initialQuantity,
  dailyStoragePrice,
  arrivedAt,
  token,
}) {
  const t = getAdminToken(token);
  const body = {
    customerId,
    description: description ?? '',
    initialQuantity:
      initialQuantity == null || initialQuantity === '' ? 1 : Number(initialQuantity) || 0,
    ...(dailyStoragePrice !== undefined && dailyStoragePrice !== ''
      ? { dailyStoragePrice: Number(dailyStoragePrice) || 0 }
      : {}),
    ...(arrivedAt != null && arrivedAt !== '' ? { arrivedAt } : {}),
  };
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte skapa (${response.status}).`);
  }
  return response.json();
}

export async function updateWarehouseItem({ itemId, patch, token }) {
  const t = getAdminToken(token);
  const response = await fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify(patch || {}),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte uppdatera (${response.status}).`);
  }
  return response.json();
}

export async function deleteWarehouseItem({ itemId, token }) {
  const t = getAdminToken(token);
  const response = await fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte ta bort (${response.status}).`);
  }
  return response.json();
}

export async function addWarehouseMovement({ itemId, movement, token }) {
  const t = getAdminToken(token);
  const response = await fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}/movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify(movement || {}),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte registrera (${response.status}).`);
  }
  return response.json();
}

export async function fetchWarehouseEstimate({ itemId, token }) {
  const t = getAdminToken(token);
  const response = await fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}/estimate`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kunde inte hämta uppskattning (${response.status}).`);
  }
  return response.json();
}
