const API_BASE = '/api/warehouse';

export async function fetchWarehouse() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse: ${response.statusText}`);
  }
  return response.json();
}
