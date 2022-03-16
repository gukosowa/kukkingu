import { getStorage, response, setAuth } from './shared.mjs'

exports.handler = async (event) => {
    console.log(event)
    console.log(await setAuth(event))
    const resStorage = await getStorage()

  return response(resStorage)
}