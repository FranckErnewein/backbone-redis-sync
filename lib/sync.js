var redis = require('redis');
var Q = require('q');

// redis client for read/write in redis
var client = redis.createClient();

function sync(method, model, options) {

  //console.log(method, model, options);

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

  if (method === 'read'){
    client.hgetall(model.id, done);
  }else if (method === 'update') {
    client.hmset(model.id, model.attributes, done);
  }

  return def.promise;
}

module.exports = sync;
