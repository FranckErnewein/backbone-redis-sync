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
  parse: parse,
  toJSON: toJSON,
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  publishOnChange: publishOnChange,
  unpublishOnChange: unpublishOnChange
});

function initialize(data, options){
  if(options && options.url){
    this.url = options.url;
  }
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

  var url = _.result(collection, 'url');
  if (method === 'read') {
    client.smembers(url, done);
  } else if (method === 'update') {
    //do nothing
  } else if (method === 'create') {
    //do nothing
  } else if (method === 'delete') {
    client.del(url, done);
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
  this.subscriber.subscribe(_.result(this, 'url'), function(err) {
    if (err) {
      def.reject();
    } else {
      //this.trigger('subscribe');
      def.resolve();
    }
  });
  this.subscriber.on('message', function(channel, dataString) {
    var eventAndData = JSON.parse(dataString);
    var event = eventAndData[0];
    var data = eventAndData[1];
    if (event === 'add') {
      self.add(data);
    } else if (event === 'remove') {
      self.remove(self.get(data));
    }
  });
  return def.promise;
}

function unsubscribe() {
  return RedisModel.prototype.subscribe.apply(arguments);
}

function publishOnChange() {
  this.on('add', _publishOnAdd, this);
  this.on('remove', _publishOnRemove, this);
  this.on('change', _publishOnChange, this);
}

function unpublishOnChange() {
  this.off('add', _publishOnAdd, this);
  this.off('remove', _publishOnRemove, this);
  this.on('change', _publishOnChange, this);
}


function _publishOnAdd(model) {
  var self = this;
  var url = _.result(this, 'url');
  if (model.id) {
    client.sadd(url, model.id, function() {
      var data = JSON.stringify(['add', model.toJSON()]);
      client.publish(url, data, function() {
        self.trigger('publish:add', model);
      });
    });
  } else {
    model.save().done(function() {
      _publishOnAdd.call(self, model);
    });
  }
}

function _publishOnRemove(model) {
  var self = this;
  var url = _.result(this, 'url');
  if (model.id) {
    client.srem(url, model.id, function() {
      var data = JSON.stringify(['remove', model.id]);
      client.publish(url, data, function() {
        self.trigger('publish:remove', model);
      });
    });
  }
}

function _publishOnChange(model) {
  var self = this;
  var url = _.result(this, 'url');
  if (model && model.changed) {
    model.save().done(function() {
      var data = JSON.stringify(['change', model.changed]);
      client.publish(url, data, function() {
        self.trigger('publish:change', model);
      });
    });
  }
}
