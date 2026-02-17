const API_URL = '/api/admin/backup';

export async function exportBackup() {
  const token = window.prompt('ADMIN_TOKEN');
  if (!token || !token.trim()) {
    throw new Error('Token krävs för att ladda ner backup.');
  }
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
    },
  });
  if (!response.ok) {
    const msg =
      response.status === 401
        ? 'Ogiltig eller saknad token.'
        : `Kunde inte ladda backup (${response.status}).`;
    throw new Error(msg);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    response.headers.get('Content-Disposition')?.split('filename=')?.[1]?.replace(/"/g, '') ||
    'hellbergs-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
