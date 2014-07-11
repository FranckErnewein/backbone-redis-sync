var Backbone = require('backbone');
var sync = require('..').sync;
var expect = require('chai').expect;
var client = require('redis').createClient();

Backbone.sync = sync;

describe('sync', function() {

  describe('create', function() {

    var data = {
      id: 'test_save',
      test: 'some data'
    };
    /*
    beforeEach(function(done){
      redis.del(data.id, function(){
        done();  
      });
    });
    */
    before(function(done) {
      client.del(data.id, function() {
        done();
      });
    });
    it('should save in redis', function(done) {
      var model = new Backbone.Model(data);
      model.save().then(function() {
        client.hget(data.id, 'test', function(err, fromRedis) {
          expect(data.test).to.deep.equal(fromRedis);
          done();
        });
      });
    });
  });

});
