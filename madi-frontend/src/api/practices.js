import client from './client';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getPractices(date) {
  const res = await client.get('/api/practices', { params: { date: formatDate(date) } });
  return res.data;
}

export async function getTemplates() {
  const res = await client.get('/api/practices/templates');
  return res.data;
}

export async function createPractice(date, content) {
  const res = await client.post('/api/practices', { date: formatDate(date), content });
  return res.data;
}

export async function updatePractice(id, content) {
  const res = await client.patch(`/api/practices/${id}`, { content });
  return res.data;
}

export async function deletePractice(id) {
  const res = await client.delete(`/api/practices/${id}`);
  return res.data;
}
