var RedisModel = require('..').RedisModel;
var expect = require('chai').expect;
var client = require('redis').createClient();

describe('RedisModel', function() {

  describe('#publish', function() {

    it('should publish change on redis', function(done) {
      var data = {
        foo: 'bar'
      };
      var model = new RedisModel({
        id: 'test_publish'
      });
      client.on('pmessage', function(pattern, channel, publishedData) {
        expect(JSON.stringify(data)).to.be.equal(publishedData);
        client.end();
        done();
      });
      client.psubscribe('test_publish');
      model.publish(data);
    });

  });

  describe('#subscribe', function() {

    it('should subcribe to model channel', function(done) {
      var m1 = new RedisModel({
        id: 'pubsub'
      });
      var m2 = new RedisModel({
        id: 'pubsub'
      });

      m2.subscribe();
      m2.once('change', function() {
        expect(m2.get('foo')).to.be.equal('bar');
        done();
      });

      m1.publish({
        foo: 'bar'
      });

    });

  });


  describe('#publishOnChange', function() {

    it('should subcribe to model channel', function(done) {
      var m1 = new RedisModel({
        id: 'pubsub'
      });
      var m2 = new RedisModel({
        id: 'pubsub'
      });

      m2.subscribe();
      m2.once('change', function() {
        expect(m2.get('foo')).to.be.equal('bar');
        done();
      });

      m1.publishOnChange();
      m1.set({
        foo: 'bar'
      });

    });

  });

});
