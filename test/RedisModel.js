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
        expect(JSON.stringify([data, []])).to.be.equal(publishedData);
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

      m2.subscribe().done(function() {
        m2.once('change', function() {
          expect(m2.get('foo')).to.be.equal('bar');
          done();
        });

        m1.publish({
          foo: 'bar'
        });

      });
    });

    it('should subscribe for unset', function(done) {
      var m1 = new RedisModel({
        unsetonsub: 'willonsetonsub'
      });
      m1.save().done(function() {
        m1.publishOnChange();
        var m2 = new RedisModel({
          id: m1.id,
          unsetonsub: 'willonsetonsub'
        });
        m2.subscribe().done(function() {
          m2.once('change', function() {
            expect(m2.get('unsetonsub')).to.be.undefined; //jshint ignore:line
            m1.unpublishOnChange();
            m2.unsubscribe();
            done();
          });
          m1.unset('unsetonsub');
        });
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
      m1.publishOnChange();
      m2.subscribe().done(function() {
        m2.once('change', function() {
          expect(m2.get('foo')).to.be.equal('bar');
          done();
        });
        m1.set({
          foo: 'bar'
        });
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
      var m1changed = 0;
      var m2changed = 0;
      m1.on('change', function() {
        m1changed++;
      });
      m2.on('change', function() {
        m2changed++;
      });

      m1.publishOnChange();
      m2.subscribe().done(function() {
        m2.once('change', function() {
          m2.unsubscribe();
          m1.set('foo', 'two');
          m2.subscribe().done(function() {
            m2.once('change', function() {
              expect(m1changed).to.be.equal(3);
              expect(m2changed).to.be.equal(2);
              done();
            });
            m1.set('foo', 'three');
          });
        });
        m1.set('foo', 'one');
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
        m2.subscribe().done(function() {
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

    it('should delete a key', function(done) {
      var m1 = new RedisModel({
        foo: 'bar',
        nomore: 10
      });
      m1.save().done(function() {
        m1.unset('nomore');
        m1.save().done(function() {
          var m2 = new RedisModel({
            id: m1.id
          });
          m2.fetch().done(function() {
            expect(m2.get('nomore')).to.be.undefined; //jshint ignore:line
            done();
          });
        });

      });

    });
  });

});
