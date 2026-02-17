const API_URL = '/api/warehouse';

export async function fetchWarehouse() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse: ${response.statusText}`);
  }
  return response.json();
}
