import { response, supabase, responseOptions } from './shared.mjs'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return responseOptions()
  }
  try {
    const { email, password } = JSON.parse(event.body);
    console.log( { email, password })
    const { user, session, error } = await supabase.auth.signUp({
      email,
      password,
    })
  
    console.log({user,session}, error);
    
    return response({user,session, error})
  } catch(e) {
    return response({error: e.message}, 400)
  }

}