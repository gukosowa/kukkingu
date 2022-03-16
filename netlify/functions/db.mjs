import { getStorage, response, setAuth, responseOptions } from './shared.mjs'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return responseOptions()
  }
    console.log(event)
    console.log(await setAuth(event))
    const resStorage = await getStorage()

  return response(resStorage)
}