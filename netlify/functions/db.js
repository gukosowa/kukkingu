import { Client } from 'pg';

export async function handler(event, context) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end();
    return {
      statusCode: 200,
      body: JSON.stringify({ time: result.rows[0] })
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
}
