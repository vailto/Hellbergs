const API_BASE = '/api/warehouse';

export async function fetchWarehouse() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse: ${response.statusText}`);
  }
  return response.json();
}

export async function createWarehouseItemWithInMovement(payload) {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function createWarehouseMovement(payload) {
  const response = await fetch(`${API_BASE}/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}
