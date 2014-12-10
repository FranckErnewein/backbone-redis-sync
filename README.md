# backbone-redis-sync

Backbone.sync for redis data base

## Install

```
npm install backbone-redis-sync --save
```

## Usage Example

```js
var Backbone = require('backbone');  
var redisSync = require('backbone-redis-sync');

var RedisDemoModel = Backbone.Model.extend({
  namespace: 'demo_model'
  sync: redisSync
});

var model = new RedisDemoModel({
  foo: 'bar'
});

model.save().done(function(){
  //saved in redis
  console.log(model.id) // => 1
  
  var same_model = new RedisDemoModel({
    id: model.id
  });

  same_model.fetch().done(function(){
    same_model.get('foo') // => 'bar'
  });

});

```
