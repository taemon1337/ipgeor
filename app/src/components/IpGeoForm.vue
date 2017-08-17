<template>
  <div class="box">
    <form>
      <div class="columns">
        <div class="column is-half">
          <div class="field">
            <label class="label">Select File</label>
            <input @change="fileSelected" name="file" class="is-hidden" type="file" ref="fileInput" multiple>
            <div class="control">
              <button type="button" class="button is-primary" @click.stop.prevent="openDialog">Select Files</button>
            </div>
          </div>
        </div>
        <div class="column is-half">
          <div class="field">
            <label class="label">Select IP addresses immediately following these characters</label>
            <div class="control">
              <input name="prefix" class="input" type="text" placeholder="prefix..." ref="prefix">
            </div>
            <small>The characters before the IP address you want to geolocate from each line (in case of multiple IPs per line)</small>
          </div>
        </div>
      </div>
    </form>
    
    <hr>
    <div v-if="files.length" class="box">
      <nav class="navbar">
        <div class="navbar-start">
          Selected Files:
        </div>
        <div class="navbar-end">
          <button @click="start" class="button is-primary">Scan for Ips</button>
        </div>
      </nav>
      <div v-for="(file, index) in files" key="index">
        <div class="media">
          <div class="media-left">
            <span v-if="file.running" class="icon is-large">
              <i class="fa fa-spin fa-spinner"></i>
            </span>
          </div>
          <div class="media-content">
            <div class="content">
              <p>
                <strong>{{ file.file.name }}</strong>
                <small>{{ bytesToSize(file.file.size) }}</small>
              </p>
            </div>
          </div>
          <div class="media-right">
            <div :class="dropdown ? 'dropdown is-active' : 'dropdown'">
              <div class="dropdown-trigger">
                <button class="button" aria-haspopup="true" aria-controls="dropdown-menu" @click='dropdown = !dropdown' @focusout="dropdown = false">
                  <span>Download As</span>
                  <span class="icon is-small">
                    <i class="fa fa-angle-down" aria-hidden="true"></i>
                  </span>
                </button>
              </div>
              <div class="dropdown-menu" id="dropdown-menu" role="menu">
                <div class="dropdown-content">
                  <a class='dropdown-item' @click.stop.prevent='saveAsJson(file)' @disabled='file.progress < 100'>Json Format</a>
                  <a class='dropdown-item' @click.stop.prevent='saveAsCsv(file)' @disabled='file.progress < 100'>CSV Format</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <br>
        <div v-if="file.progress">
          <progress :class="file.stat" :value="file.progress" max="100">{{ file.progress }}</progress>
        </div>
        <div v-if="file.error">
          <div class="notification is-danger">{{ file.error }}</div>
        </div>
        <div v-if="file.progress === 100 && results && results[file.file.name].length">
          <table class="table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Line Number</th>
                <th>IP address</th>
                <th>
                  <a @click.stop.prevent="geolocate(file)" @disabled="file.progress < 100 || !results || !results[file.file.name].length" class="is-link is-primary">
                    Geolocate
                    <span class="icon is-small">
                      <i class="fa fa-globe"></i>
                    </span>
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, index) in results[file.file.name]" key="index">
                <td>{{ file.file.name }}</td>
                <td>{{ index }}</td>
                <td>{{ result.ip }}</td>
                <td>{{ result.geo }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import bytesToSize from '@/lib/bytesToSize'
  import LineReader from '@/lib/LineReader'
  import api from '@/api'
  import Cacher from '@/lib/Cacher'
  import FileSaver from 'file-saver'

  let ipregex = /((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/g

  export default {
    name: 'IpGeoForm',
    data () {
      return {
        files: [],
        count: null,
        running: false,
        results: {},
        dropdown: false
      }
    },
    methods: {
      openDialog () {
        this.$refs.fileInput.click()
      },
      fileSelected (e) {
        for (let i = 0; i < e.target.files.length; i += 1) {
          this.addFile(e.target.files[i])
        }
      },
      addFile (file) {
        this.files.push({ progress: 0, running: false, error: null, stat: null, file: file })
      },
      bytesToSize (s) {
        return bytesToSize(s)
      },
      start () {
        for (let i = 0; i < this.files.length; i += 1) {
          this.runFile(this.files[i])
        }
      },
      runFile (file) {
        let self = this
        if (file.running) { return false }
        console.log('running file ' + file.file.name)
        let count = 0
        self.results[file.file.name] = []
        file.running = true
        file.stat = 'progress is-warning'
        file.progress = 1
        let reader = LineReader({ chunkSize: 1024 })

        reader.on('line', function (line, next, percent) {
          count += 1
          self.results[file.file.name].push({ index: count, line: line, ip: self.parseIp(line) })
          file.progress = percent
          next()
        })

        reader.on('error', function (err) {
          file.error = err
          file.stat = 'progress is-danger'
        })

        reader.on('end', function () {
          file.progress = 100
          file.stat = 'progress is-success'
          file.running = false
        })

        reader.read(file.file)
      },
      parseIp (line) {
        let prefix = this.$refs.prefix.value || ''
        let m = ipregex.exec(line)
        let c = 0
        let matches = []
        let ret = ''

        while (m) {
          let match = m.slice(0, 1)
          matches = matches.concat(match)
          m = ipregex.exec(line)
          c += 1
          if (c > 100) { break }
        }

        for (let i = 0; i < matches.length; i += 1) {
          if (line.indexOf(prefix + matches[i]) >= 0) {
            ret = matches[i]
            return ret
          }
        }
        return ret
      },
      geolocate (file) {
        let self = this
        if (this.results[file.file.name] && this.results[file.file.name].length) {
          let results = self.results[file.file.name]
          let ips = results.map(function (result) { return result.ip })
          Cacher(ips, api.ipgeo.batch, {}).then(function (resp) {
            resp.forEach(function (result, i) {
              if (result.status === 'success') {
                results[i].geo = [result.city, result.countryCode].join(', ')
              } else {
                results[i].geo = result.message
              }
              results[i].geolocation = result // full result
            })
            // self.results[file.file.name] = results
            let r = {}
            r[file.file.name] = results
            self.results = Object.assign({}, self.results, r) // need to object.assign for Vue to pickup change
          }).catch(function (err) {
            file.error = err
            file.stat = 'progress is-danger'
          })
        }
      },
      saveAsJson (file) {
        let filename = file.file.name + '.geo.json'
        let data = this.results[file.file.name]
        let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        FileSaver.saveAs(blob, filename)
      },
      saveAsCsv (file) {
        let filename = file.file.name + '.geo.csv'
        let results = this.results[file.file.name]
        let data = [['#', 'Line', 'Ip Address', 'Geolocation', 'GeolocationJson'].join(', ')]
        results.forEach(function (result) {
          data.push([result.index, result.line, result.ip, result.geo, JSON.stringify(result.geolocation).replace(/,/g, '')].join(', '))
        })
        let blob = new Blob([data.join('\n')], { type: 'text/csv' })
        FileSaver.saveAs(blob, filename)
      }
    }
  }
</script>
