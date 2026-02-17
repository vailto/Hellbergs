// Masterdata API service – GET /api/masterdata

const API_BASE = '/api/masterdata';

export async function fetchMasterdata() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch masterdata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching masterdata:', error);
    throw error;
  }
}
