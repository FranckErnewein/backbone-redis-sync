var Backbone = require('backbone');
var redis = require('redis');
var Q = require('q');
var sync = require('./sync');

var Parent = Backbone.Model;

module.exports = Parent.extend({
  sync: sync,
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  publish: publish,
  publishOnChange: publishOnChange,
  unpublishOnChange: unpublishOnChange
});



function subscribe() {
  var def = Q.defer();
  var self = this;
  if (!this.subscriber) {
    this.subscriber = redis.createClient();
  }
  this.subscriber.subscribe(this.id, function(err) {
    if (err) {
      def.reject();
    } else {
      //this.trigger('subscribe');
      def.resolve();
    }
  });
  this.subscriber.on('message', function(channel, data) {
    self.set(JSON.parse(data));
  });
  return def.promise;
}

function unsubscribe() {
  if (this.subscriber) {
    this.subscriber.unsubscribe();
    this.subscriber.end();
    delete this.subscriber;
    //this.trigger('unsubscribe');
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
  this.on('change', _publishChangedAttributes, this);
}

function unpublishOnChange() {
  this.off('change', _publishChangedAttributes);
}

function _publishChangedAttributes(model) {
  this.publish(model.changed);
}

