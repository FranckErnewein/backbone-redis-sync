var Backbone = require('backbone');
var redis = require('redis');
var _ = require('lodash');
var Q = require('q');

var RedisModel = require('./RedisModel');

var Parent = Backbone.Collection;
var client = redis.createClient();

module.exports = Parent.extend({
  model: RedisModel,
  initialize: initialize,
  sync: sync,
  add: add,
  parse: parse,
  toJSON: toJSON,
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  publishOnChange: publishOnChange,
  unpublishOnChange: unpublishOnChange
});

function initialize() {
  this.toAdd = [];
  this.toRemove = [];
  this.on('add', function() {

  }, this);
}

function sync(method, collection, options) {
  var def = Q.defer();

  function done(err, data) {
    if (err) {
      // throw new Error(err);
      console.log('backbone-redis-sync error:');
      console.log(err);
    } else {
      if (options && options.success) {
        options.success(data);
      }
      def.resolve(data);
    }
  }

  if (method === 'read') {
    client.lrange(_.result(collection.url), 0, -1, done);
  } else if (method === 'update') {
    //do nothing
  } else if (method === 'create') {
    //do nothing
  } else if (method === 'delete') {
    client.del(collection.url(), done);
  }

  return def.promise;
}

function parse(json) {
  return _.map(json, function(id) {
    return {
      id: id
    };
  });
}

function toJSON() {
  return this.pluck('id');
}

function subscribe() {
  var def = Q.defer();
  var self = this;
  if (!this.subscriber) {
    this.subscriber = redis.createClient();
  } else {
    return;
  }
  this.subscriber.subscribe(this.id, function(err) {
    if (err) {
      def.reject();
    } else {
      //this.trigger('subscribe');
      def.resolve();
    }
  });
  this.subscriber.on('message', function(channel, eventAndId) {
    var eventAndIdArray = eventAndId.split(':');
    var event = eventAndIdArray[0];
    var id = eventAndIdArray[1];
    if (event === 'add') {
      this.add({
        id: id
      });
    } else if (event === 'remove') {
      this.remove(this.get(id));
    }
    self.add(eventAndIdArray[0]);
  });
}

function add(model) {
  if(model instanceof Array){
    _.each(model, this.add, this);
    return model;
  }
  var self = this;
  var url = _.result(this.url);
  var def = Q.defer();
  if (model.id) {
    client.rpushx(url, model.id, function() {
      Parent.prototype.add.apply(this, arguments);
      client.publish(url, 'add:' + model.id).done(function() {
        def.resolve();
      });
    });
  } else {
    model.save().done(function() {
      self.add(model).done(function() {
        def.resolve();
      });
    });
  }
  return def.promise;
}

function unsubscribe() {
  return RedisModel.prototype.subscribe.apply(arguments);
}

function publishOnChange() {
  this.on('add', _publishOnAdd, this);
  this.on('remove', _publishOnRemove, this);
}

function unpublishOnChange() {
  this.off('add', _publishOnAdd, this);
  this.off('remove', _publishOnRemove, this);
}


function _publishOnAdd(model) {
  if (model.id) {
    client.rpushx(this.url(), model.id, function() {
      client.publish(this.url(), 'add:' + model.id);
    });
  } else {
    model.save().done(function() {
      _publishOnRemove.call(this, model);
    });
  }
}

function _publishOnRemove(model) {
  if (model.id) {
    client.lrem(this.url(), 0, model.id, function() {
      client.publish(this.url(), 'remove:' + model.id);
    });
  }
}
