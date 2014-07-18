var _ = require('lodash');
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
  this.subscriber.on('message', function(channel, diffString) {
    var diff = JSON.parse(diffString);
    var attrs = diff[0];
    var toUnset = diff[1];
    self.set(attrs);
    _.each(toUnset, function(attr){
      self.unset(attr);
    });
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

  var minus = _.keys(_.pick(data, function(value){
    return value === undefined;
  }));
  var diff = JSON.stringify([data, minus]);


  this.publisher.publish(this.id, diff, function(err, data) {
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

