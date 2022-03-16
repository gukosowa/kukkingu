import { response, supabase } from './shared.mjs'

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body);
  const { user, session, error } = await supabase.auth.signIn({
    email,
    password,
  })

  console.log({user,session}, error);
  
  return response(data)
}