import client from './client';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getActivePack(date) {
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  const res = await client.get('/packs/active', { params: { date: dateStr } });
  return res.data;
}

export async function selectPack(packId) {
  const res = await client.post(`/packs/${packId}/select`);
  return res.data;
}
