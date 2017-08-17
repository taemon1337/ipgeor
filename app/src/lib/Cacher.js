import Batcher from '@/lib/Batcher'

export default function Cacher (batch, batchHandler, opts, httplib) {
  return new Promise(function (resolve, reject) {
    let cache = {}
    let resp = new Array(batch.length)
    let uncached = []

    batch.forEach(function (query, i) {
      if (cache[query]) {
        resp[i] = cache[query]
      } else {
        uncached.push({ index: i, query: query })
      }
    })

    if (uncached.length) {
      Batcher(uncached.map(function (item) { return item.query }), batchHandler, opts, httplib).then(function (batchResults) {
        batchResults.forEach(function (batchResult, i) {
          let item = uncached[i] // batch handler should return array of same size with corresponding results
          cache[item.query] = batchResult
          resp[item.index] = batchResult
        })

        resolve(resp)
      }).catch(reject)
    } else {
      resolve(resp)
    }
  })
}
