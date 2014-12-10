var fs = require('fs');
var path = require('path');
var redis = require('redis');
var Q = require('q');

var client = redis.createClient();

var lua_save = fs.readFileSync(path.join(__dirname, 'save.lua'), {
  encoding: 'utf8'
});
var lua_delete = fs.readFileSync(path.join(__dirname, 'delete.lua'), {
  encoding: 'utf8'
});

function sync(method, model, options) {
  var def = Q.defer();

  function redis_callback(err, redis_result) {
    if (err && options && options.error) {
      options.error(err);
      def.reject(err);
    } else if (options && options.success) {
      var result;
      if (typeof redis_result === 'string') {
        result = JSON.parse(redis_result);
      } else if (typeof redis_result === 'object') {
        result = redis_result;
      }
      options.success(result);
      def.resolve(result);
    }
  }

  if (method === 'create' || method === 'update') {
    client.EVAL(lua_save, 1, model.namespace, JSON.stringify(model.toJSON()), redis_callback);
  } else if (method === 'read') {
    client.HGETALL(model.namespace + ':' + model.id, redis_callback);
  } else if (method === 'delete') {
    if(!model.id){
      throw new Error('can not delete new model or model without id');
    }
    client.EVAL(lua_delete, 1, model.namespace, model.id, redis_callback);
  }

  return def.promise;
}

module.exports = sync;
