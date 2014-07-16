//var RedisModel = require('..').RedisModel;
var RedisCollection = require('..').RedisCollection;
var expect = require('chai').expect;
var client = require('redis').createClient();

describe('RedisCollection', function() {

  after(function(done) {
    client.end();
    done();
  });

  var n = 0;
  afterEach(function(done) {
    n++;
    client.del( 'test/col/' + n , function() {
      done();
    });
  });

  it('should create a new collection', function(done) {
    var c1 = new RedisCollection([], {
      url: 'test/col/1'
    });
    c1.publishOnChange();
    var c2 = new RedisCollection([], {
      url: 'test/col/1'
    });
    c1.once('publish:add', function() {
      c2.fetch().done(function() {
        expect(c2.first().id).to.be.equal('testColId');
        done();
      });
    });
    c1.add({
      id: 'testColId',
      foo: 'bar'
    });
  });

  it('should subscribe on add', function(done) {
    var c1 = new RedisCollection([], {
      url: 'test/col/2'
    });
    c1.publishOnChange();
    var c2 = new RedisCollection([], {
      url: 'test/col/2'
    });
    c2.subscribe().done(function() {
      c2.once('add', function() {
        expect(c2.first().id).to.be.equal('xoxoid');
        done();
      });
      c1.add({
        id: 'xoxoid',
        foo: 'bar'
      });
    });
  });

  it('should add thne remove in both collection', function(done) {
    var c1 = new RedisCollection([], {
      url: 'test/col/3'
    });
    c1.publishOnChange();
    var c2 = new RedisCollection([], {
      url: 'test/col/3'
    });
    c2.subscribe().done(function() {
      c2.once('add', function() {
        expect(c2.first().id).to.be.equal('will_be_remove');
        c2.once('remove', function() {
          expect(c2.length).to.be.equal(0);
          done();
        });
        c1.remove(c1.get('will_be_remove'));
      });
      c1.add({
        id: 'will_be_remove'
      });
    });
  });


});
