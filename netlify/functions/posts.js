// Deprecated endpoint. The "posts" API has been removed.
export default async () => {
  return new Response(
    JSON.stringify({ error: 'Gone', message: 'This endpoint has been removed. Use /api/recipes instead.' }),
    {
      headers: { 'content-type': 'application/json' },
      status: 410,
    }
  );
};

export const config = {
  path: '/api/posts',
};
