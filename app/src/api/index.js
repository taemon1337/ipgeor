import axios from 'axios'

let proxy = axios.create({
  baseURL: '/proxy/',
  timeout: 10000
})

proxy.interceptors.request.use(function (req) {
  req.url = req.baseURL + req.url
  return req
})

let ipgeo = {
  batch: function (ips) {
    let data = ips.map(function (m) { return { query: m } })
    return proxy.post('http://ip-api.com/batch', data)
  }
}

export default {
  axios: axios,
  proxy: proxy,
  ipgeo: ipgeo
}
