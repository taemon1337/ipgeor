import isArray from '@/lib/isArray'
import Promisify from '@/lib/Promisify'

let defaults = {
  batchSize: 100,
  maxPerMinute: 150,
  timeout: 10000
}

/**
 * Batcher returns a Promise which resolves an array of results
 * Args:
 *   all - an array of items to be batch processed
 *   batchHandler - a function to receive a batch of items to process which can return a promise or a value
 *   opts - { batchSize: 100, maxPerMinute: 150 } overrides
 */
export default function Batcher (all, batchHandler, opts, httplib) {
  let batchSize = opts.batchSize > 0 ? opts.batchSize : defaults.batchSize
  let maxPerMinute = opts.maxPerMinute > 0 ? opts.maxPerMinute : defaults.maxPerMinute
  let promisify = Promisify(batchHandler)

  if (isArray(all) && typeof batchHandler === 'function') {
    return new Promise(function (resolve, reject) {
      let index = 0
      let results = []

      let next = function (batch) {
        index += batchSize

        let result = promisify(batch, httplib) // result will be a promise
        result.then(function (batchResults) {
          results = results.concat(batchResults)

          if (index > all.length) {
            resolve(results)
          } else {
            setTimeout(function () {
              next(all.slice(index, index + batchSize))
            }, 60 * 1000 / maxPerMinute)
          }
        })
      }

      next(all.slice(index, index + batchSize)) // process 1st batch
    })
  } else {
    throw new Error('Invalid arguments, Batcher requires an array of items to process with given batchHandler')
  }
}
