export async function updateCustomerHasDmt({ id, hasDmt, token }) {
  const t = token?.trim() || window.prompt('ADMIN_TOKEN');
  if (!t) {
    throw new Error('Token krävs för att uppdatera kund.');
  }
  const response = await fetch(`/api/customers/${encodeURIComponent(id)}/has-dmt`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify({ hasDmt }),
  });
  if (!response.ok) {
    const msg =
      response.status === 401
        ? 'Ogiltig eller saknad token.'
        : response.status === 404
          ? 'Kunden hittades inte.'
          : `Kunde inte uppdatera (${response.status}).`;
    throw new Error(msg);
  }
  return response.json();
}
