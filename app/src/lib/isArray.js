export default function (obj) {
  return obj && obj.forEach && typeof obj.forEach === 'function'
}
