import { response, supabase } from './shared'
import type { Handler } from '@netlify/functions'
import type { Event } from '@netlify/functions/dist/function/event'

const handler: Handler = async (event: Event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return response({}, 'No POST method')
    }

    const body = JSON.parse('' + event.body)
    const { user, session, error } = await supabase.auth.signIn({
      email: body.email,
      password: body.password,
    })

    return response({ event, user, session, error })
  } catch (_e) {
    return response({}, 'Something happened')
  }
}

export { handler }
