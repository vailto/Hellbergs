const API_URL = '/api/pricing';

export async function fetchPricing() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing: ${response.statusText}`);
  }
  return response.json();
}
