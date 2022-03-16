import dotenv from 'dotenv'
dotenv.config()
const {
  SUPABASE_URL,
  SUPABASE_KEY
} = process.env;

import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export function setAuth(event) {
  const { user, error } = supabase.auth.setAuth(access_token)
  return { user, error }
}

export function response(body, statusCode = 200) {
    return {
        statusCode,
     headers: {
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Credentials': true
     },
     body: JSON.stringify(body)
 }
}

export function getStorage() {
  return supabase
        .from('main')
        .select('storage')
}