var RedisModel = require('..').RedisModel;
var expect = require('chai').expect;
var redis = require('redis');
var client = redis.createClient();

describe('RedisModel', function() {

  after(function(done) {
    client.end();
    done();
  });

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
        id: 'autopubsub'
      });
      var m2 = new RedisModel({
        id: 'autopubsub'
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

  describe('#unsubscribe', function() {

    it('should subcribe then unsubscribe to a model channel', function(done) {
      var m1 = new RedisModel({
        id: 'unsub'
      });
      var m2 = new RedisModel({
        id: 'unsub'
      });
      var n = 0;

      m1.publishOnChange();
      m2.subscribe();
      m2.once('change', function() {
        m2.unsubscribe();
        m1.set('foo', 'baz');
      });
      m2.on('change', function() {
        n++;
      });

      m1.set('foo', 'bar');

      var subscriber = redis.createClient();
      subscriber.subscribe(m2.id, function(){
        expect(n).to.be.equal(1);
        done();
      });

    });
  });

  describe('#save', function() {
    it('should publish on a save() action', function(done) {

      var m1 = new RedisModel();
      m1.publishOnChange();
      m1.save({
        foo: 'bar'
      }).done(function() {
        var m2 = new RedisModel({
          id: m1.id
        });
        m2.subscribe().done(function(){
          m2.once('change', function() {
            expect(m2.get('foo')).to.be.equal('baz');
            m2.unsubscribe();
            done();
          });
          m1.save({
            foo: 'baz'
          });
        });
      });

    });
  });

});
