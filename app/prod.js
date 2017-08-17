var server = require('http').createServer()
  , express = require('express')
  , request = require('request')
  , app = express()
  , port = process.env.PORT || 8080
  , env = process.env.ENV || 'prod'
  , API = process.env.API || 'http://api:8080'
  ;

app.use(express.static('web'));

// app.all('/api*', function(req, res) {
//   req.pipe(request(API+req.originalUrl)).pipe(res);
// });

app.all('/proxy/*', function (req, res) {
  try {
    var url = req.originalUrl.toString().split('proxy/').pop();
    console.log('PROXY -> ' + url);
    req.pipe(request(url)).pipe(res);
  } catch (err) {
    console.warn('Error in Proxy: ', err)
    return res.sendStatus(400);
  }
})

server.on('request', app);
server.listen(port, function() { console.log('Listening on ' + server.address().port) });
