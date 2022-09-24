import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Event } from '@netlify/functions/dist/function/event'
import type { Response } from '@netlify/functions/dist/function/response'

config()
const { DATABASE_URL, SUPABASE_SERVICE_API_KEY } = process.env

export const supabase = createClient(
  '' + DATABASE_URL,
  '' + SUPABASE_SERVICE_API_KEY
)

export function response(data: any, error?: any): Response {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Supabase-Auth, Content-Type, Referer',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT',
    },
    body: JSON.stringify({ data, error }),
  }
}

export function setAuth(event: Event) {
  const access_token = event.headers['x-supabase-auth']
  if (!access_token) {
    throw new Error('No Auth')
  }
  return supabase.auth.setAuth(access_token)
}
