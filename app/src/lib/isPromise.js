export default function isPromise (obj) {
  return obj && obj.then && typeof obj.then === 'function'
}
