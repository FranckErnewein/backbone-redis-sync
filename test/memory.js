var util = require('util');
var Model = require('../lib/RedisModel');

var i = 0;
setInterval(function(){
  i++;
  if(i%1000 === 0){
    var model = new Model();
    model.set({
      id: 1,
      truc: 43
    });
    console.log(util.inspect(process.memoryUsage()));
  }
}, 1);
