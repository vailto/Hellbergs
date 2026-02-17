const API_BASE = '/api/pricing';

export async function fetchPricing() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing: ${response.statusText}`);
  }
  return response.json();
}
