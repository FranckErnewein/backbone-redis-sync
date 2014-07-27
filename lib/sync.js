var redis = require('redis');
var _ = require('lodash');
var Q = require('q');
var config = require('./config');

// redis client for read/write in redis
var client = redis.createClient();


function sync(method, model, options) {

  var def = Q.defer();
  var resultWith;

  function error(err) {
    if(err){
      // throw new Error(err);
      console.log('backbone-redis-sync error:');
      console.log(err);
    }
    if (options && options.error) {
      options.error();
    }
    def.reject();
  }

  function success(data) {
    if (options && options.success) {
      options.success(resultWith || data);
    }
    def.resolve(data);
  }

  function done(err, data) {
    if (err) {
      error(err);
    } else if (method === 'read' && data === null) {
      error();
    } else {
      success(data);
    }
  }

  if (method === 'read') {
    client.hgetall(model.id, done);
  } else if (method === 'update') {
    resultWith = model.toJSON();
    client.hkeys(model.id, function(err, keys) {
      var commands = client.multi();
      if (err) {
        done(err);
      } else {
        _.each(keys, function(key) {
          if (!model.has(key)) {
            commands.hdel(model.id, key);
          }
        });
      }
      commands.hmset(model.id, model.attributes);
      commands.exec(done);
    });
  } else if (method === 'create') {
    client.incr(config.UID_KEY, function(err, id) {
      if (!err) {
        if (id) {
          model.set(model.idAttribute, config.ID_PREFIX + id);
          client.hmset(model.id, model.attributes, done);
        } else {
          throw new Error('UID not found');
        }
      } else {
        done(err, id);
      }
    });
  } else if (method === 'delete') {
    client.del(model.id, done);
  }

  return def.promise;
}

module.exports = sync;
