var redis = require('redis');
var Q = require('q');
var config = require('./config');

// redis client for read/write in redis
var client = redis.createClient();


function sync(method, model, options) {

  var def = Q.defer();

  function done(err, data) {
    if (err) {
      // throw new Error(err);
      console.log('backbone-redis-sync error:');
      console.log(err);
      def.reject();
    } else {
      if (options && options.success) {
        options.success(data);
      }
      def.resolve(data);
    }
  }

  if (method === 'read'){
    client.hgetall(model.id, done);
  }else if (method === 'update') {
    client.hmset(model.id, model.attributes, done);
  }else if (method === 'create') {
    client.incr(config.UID_KEY, function(err, id){
      if(!err){
        if(id){
          model.set(model.idAttribute, config.ID_PREFIX + id);
          client.hmset(model.id, model.attributes, done);
        }else{
          throw new Error('UID not found');
        }
      }else{
        done(err, id);
      }
    });
  }else if (method === 'delete') {
    client.del(model.id, done);
  }

  return def.promise;
}

module.exports = sync;
