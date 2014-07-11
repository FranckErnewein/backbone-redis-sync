var redis = require('redis');
var _ = require('lodash');
var Q = require('q');

// redis client for read/write in redis
var client = redis.createClient();

function sync(method, model, options) {

  //console.log(method, model, options);

  var def = Q.defer();

  function done(err) {
    if (err) {
      // throw new Error(err);
      console.log('backbone-redis-sync error:');
      console.log(err);
    } else {
      if (options && options.success) {
        options.success();
      }
      def.resolve();
    }
  }

  if (method === 'update') {
    var query = client.multi();
    _.each(model.attributes, function(value, key){
      query.hset(model.id, key, value);
    });
    query.exec(done);
  }

  return def.promise;
}

module.exports = sync;
