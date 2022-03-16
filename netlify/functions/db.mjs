import { getStorage, response } from './shared.mjs'

exports.handler = async (event) => {
    const resStorage = await getStorage()

  return response(resStorage)
}