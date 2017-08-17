import isPromise from '@/lib/isPromise'

/*
 * Promisify is a function wrapper that returns a function which is guaranteed to return a Promise
 */
export default function Promisify (handler) {
  if (typeof handler === 'function') {
    return function (a, b, c, d, e, f) {
      return new Promise(function (resolve, reject) {
        try {
          let result = handler(a, b, c, d, e, f) // should use handler.apply
          if (isPromise(result)) {
            result.then(function (resp) {
              if (typeof resp === 'object' && resp.data) {
                resolve(resp.data) // since axios return data in the 'data' field
              } else {
                resolve(resp)
              }
            }).catch(reject) // if handler returns a promise, then resolve/reject it
          } else {
            resolve(result) // else resolve the actual result
          }
        } catch (err) {
          reject(err) // ensure we catch all errors
        }
      })
    }
  } else {
    throw new Error('Promisify requires a single argument which MUST be a function!')
  }
}
