var request = require('request')

function Jandi () {
  this.webhookUrl = null
}

Jandi.prototype.setWebhook = function (url) {
  this.webhookUrl = url
  return this
}

Jandi.prototype.webhook = function (payload, callback) {
  var data = {}

  if (payload.body) {
    data.body = payload.body
  }
  if (payload.connect) {
    var connect = payload.connect
    if (connect.color) {
      data.connectColor = connect.color
    }
    if (connect.info) {
      data.connectInfo = []
      for (var i = 0; i < connect.info.length; i++) {
        data.connectInfo.push(connect.info[i])
      }
    }
  }

  return request({
    uri: this.webhookUrl,
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.tosslab.jandi-v2+json'
    },
    json: true,
    body: data
  }, function (err) {
    callback(err)
  })
}

module.exports = Jandi
