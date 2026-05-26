import client from './client';

export async function getShop() {
  const res = await client.get('/shop');
  return res.data;
}

export async function buyPack(packId) {
  const res = await client.post(`/shop/${packId}/buy`);
  return res.data;
}
