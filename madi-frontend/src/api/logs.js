import client from './client';

export async function incrementSticker(practiceId) {
  const res = await client.patch(`/api/logs/${practiceId}/increment`);
  return res.data;
}

export async function decrementSticker(practiceId) {
  const res = await client.patch(`/api/logs/${practiceId}/decrement`);
  return res.data;
}
