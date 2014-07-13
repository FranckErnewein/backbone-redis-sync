var Backbone = require('backbone');
var redis = require('redis');
var Q = require('q');

function subscribe() {
  var self = this;
  if (!this.subscriber) {
    this.subscriber = redis.createClient();
  }
  this.subscriber.subscribe(this.id);
  this.subscriber.on('message', function(channel, data) {
    self.set(JSON.parse(data));
  });
}

function unsubscribe() {
  if (this.subscriber) {
    this.subscriber.unsubscribe();
    this.subscriber.end();
    delete this.subscriber;
  }
}


function publish(data) {
  var def = Q.defer();
  if (!this.publisher) {
    this.publisher = redis.createClient();
  }
  var msg;
  if (typeof data === 'object') {
    msg = JSON.stringify(data);
  } else {
    msg = data;
  }
  this.publisher.publish(this.id, msg, function(err, data) {
    if (err) {
      Q.reject(err);
    } else {
      Q.resolve(data);
    }
  });
  return def.promise;
}

function publishOnChange() {
  this.on('change', function(model) {
    this.publish(model.changed);
  }, this);
}

module.exports = Backbone.Model.extend({
  sync: require('./sync'),
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  publish: publish,
  publishOnChange: publishOnChange
});
