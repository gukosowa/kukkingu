import { response, supabase } from './shared.mjs'

exports.handler = async (event) => {
    const { data, error } = await supabase
        .from('main')
        .select('storage')

  console.log(data, error);
  
  return response(data)
}