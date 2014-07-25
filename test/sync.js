var Backbone = require('backbone');
var sync = require('..').sync;
var UID_KEY = require('..').config.UID_KEY;
var ID_PREFIX = require('..').config.ID_PREFIX;
var expect = require('chai').expect;
var client = require('redis').createClient();

Backbone.sync = sync;

describe('sync', function() {

  describe('create', function() {

    var data = {
      id: 'test_save',
      test: 'some data'
    };

    function del(done) {
      client.del(data.id, function() {
        done();
      });
    }
    before(del);
    after(del);

    it('should save in redis', function(done) {
      var model = new Backbone.Model(data);
      model.save().then(function() {
        expect(data).to.deep.equal(model.toJSON());
        client.hget(data.id, 'test', function(err, fromRedis) {
          expect(data.test).to.deep.equal(fromRedis);
          done();
        });
      });
    });


    it('should fetch data from redis', function(done) {
      var model = new Backbone.Model({
        id: data.id
      });
      model.fetch().done(function() {
        expect(model.get('test')).to.be.equal(data.test);
        done();
      });
    });

    it('should delete data from redis', function(done) {
      var model = new Backbone.Model({
        id: data.id
      });
      model.destroy().done(function() {
        client.hget(data.id, 'test', function(err, fromRedis) {
          expect(fromRedis).to.be.equal(null);
          done();
        });
      });
    });

    it('should create a new model with new ID', function(done) {
      var model = new Backbone.Model({
        foo: 'bar'
      });
      model.save().done(function(){
        client.get(UID_KEY, function(err, key){
          expect(model.id).to.be.equal(ID_PREFIX + key);
          client.hget(model.id, 'foo', function(err, valueInRedis){
            expect(valueInRedis).to.be.equal('bar');
            done();
          });
        });
      });
    });

  });

});
