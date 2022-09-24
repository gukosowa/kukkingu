import type { Handler } from '@netlify/functions'
import { setAuth, response, supabase } from './shared'

const handler: Handler = async (event) => {
  try {
    setAuth(event)
    let resDB: any = {}

    if (event.httpMethod === 'POST') {
      const body = JSON.parse('' + event.body)
      resDB = await supabase
        .from('main')
        .upsert({ id: 1, storage: body.storage }, { onConflict: 'id' })
      return response(resDB.data, resDB.error)
    }

    if (event.httpMethod === 'GET') {
      resDB = await supabase.from('main').select('storage').eq('id', 1)
      return response(resDB.data, resDB.error)
    }

    return response('No action')
  } catch (error) {
    // @ts-ignore
    return response(error.message)
  }
}

export { handler }
