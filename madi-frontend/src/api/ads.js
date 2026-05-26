import client from './client';

export async function watchAd() {
  const res = await client.post('/ads/watch');
  return res.data;
}
