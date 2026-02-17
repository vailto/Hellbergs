const API_BASE = '/api/pricing';

export async function fetchPricing() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing: ${response.statusText}`);
  }
  return response.json();
}

function getAdminToken(token) {
  const t = token?.trim() || window.prompt('ADMIN_TOKEN');
  if (!t) throw new Error('Token krävs för att spara priser.');
  return t.trim();
}

export async function upsertPricingRow({ customerId, validFrom, row, token }) {
  const t = getAdminToken(token);
  const response = await fetch(
    `${API_BASE}/customer/${encodeURIComponent(customerId)}/valid-from/${encodeURIComponent(validFrom)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(row || {}),
    }
  );
  if (!response.ok) {
    const msg =
      response.status === 401
        ? 'Ogiltig eller saknad token.'
        : response.status === 400
          ? 'Ogiltig data.'
          : `Kunde inte spara (${response.status}).`;
    throw new Error(msg);
  }
  return response.json();
}

export async function deletePricingRow({ customerId, validFrom, token }) {
  const t = getAdminToken(token);
  const response = await fetch(
    `${API_BASE}/customer/${encodeURIComponent(customerId)}/valid-from/${encodeURIComponent(validFrom)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    }
  );
  if (!response.ok) {
    const msg =
      response.status === 401
        ? 'Ogiltig eller saknad token.'
        : response.status === 404
          ? 'Raden hittades inte.'
          : `Kunde inte ta bort (${response.status}).`;
    throw new Error(msg);
  }
  return response.json();
}
