//var RedisModel = require('..').RedisModel;
var RedisCollection = require('..').RedisCollection;
var expect = require('chai').expect;
var client = require('redis').createClient();

describe('RedisCollection', function() {

  after(function(done) {
    client.end();
    done();
  });

  describe('#sync', function() {
    var c1 = new RedisCollection([], {
      url: 'test/col'
    });

    it.skip('should create a new collection', function() {
      var c2 = new RedisCollection([], {
        url: 'test/col'
      });
      c2.fetch().done(function(){
        expect(c2.first().id).to.be.equal('testColId');
      });
      c1.add({
        id: 'testColId',
        foo: 'bar'
      });
    });

  });

});
