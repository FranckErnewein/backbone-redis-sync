var Backbone = require('backbone');
var redis = require('redis');

function subscribe() {
  var self = this;
  this.subscriber = redis.createClient();
  this.subscriber.psubscribe(this.id);
  this.subscriber.on('pmessage', function(pattern, channel, data) {
    self.set(JSON.parse(data));
  });
}


function publish(data) {
  if (!this.client) {
    this.client = redis.createClient();
  }
  var msg;
  if (typeof data === 'object') {
    msg = JSON.stringify(data);
  } else {
    msg = data;
  }
  this.client.publish(this.id, msg, function() {});
}

function publishOnChange() {
  this.on('change', function(model){
    this.publish(model.changed);
  }, this);
}

module.exports = Backbone.Model.extend({
  sync: require('./sync'),
  subscribe: subscribe,
  publish: publish,
  publishOnChange: publishOnChange
});
