var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var redis = require('redis');
var client = redis.createClient();

var lua_save = fs.readFileSync(path.join(__dirname, '../lib/save.lua'), {
  encoding: 'utf8'
});
var lua_delete = fs.readFileSync(path.join(__dirname, '../lib/delete.lua'), {
  encoding: 'utf8'
});

describe('lua', function() {

  describe('save', function() {
    var data = {
      id: 15,
      foo: 'bar',
      count: 10,
      valid: false
    };

    var namespace = 'luatest';

    before(function(done) {
      var multi = client.multi();
      multi.DEL(namespace + ':' + data.id);
      multi.DEL(namespace + ':1');
      multi.DEL(namespace + ':2');
      multi.DEL(namespace + '_uniq_id');
      multi.exec(function() {
        done();
      });
    });


    it('should save in redis', function(done) {

      client.EVAL(lua_save, 1, namespace, JSON.stringify(data), function(err, rdata) {
        expect(data).deep.equal(JSON.parse(rdata));
        client.HGETALL(namespace + ':' + data.id, function(err, hget_data) {
          expect(hget_data.foo).to.be.equal(data.foo);
          //type is lost in redis: numbers becomes strings
          expect(hget_data.count).to.be.equal(data.count.toString());
          expect(hget_data.valid).to.be.equal(data.valid.toString());
          done();
        });
      });

    });

    it('should create the index for a new insertion', function(done) {
      var new_data = {
        foo: 'baz'
      };
      client.EVAL(lua_save, 1, namespace, JSON.stringify(new_data), function() {
        client.GET(namespace + '_uniq_id', function(err, incremented) {
          expect(incremented).to.be.equal('1');
          client.EVAL(lua_save, 1, namespace, JSON.stringify(new_data), function() {
            client.GET(namespace + '_uniq_id', function(err2, incremented2) {
              expect(incremented2).to.be.equal('2');
              done();
            });
          });
        });
      });
    });

    it('should publish save', function(done) {
      var subscriber = redis.createClient();
      subscriber.subscribe(namespace + ':' + data.id + '#save', function() {
        client.EVAL(lua_save, 1, namespace, JSON.stringify(data));
      });
      subscriber.on('message', function(channel, broadcasted_json) {
        var foo_value = JSON.parse(broadcasted_json).foo;
        expect(foo_value).to.be.equal(data.foo);
        done();
      });
    });

  });


  describe('delete', function() {

    it('should delete from redis', function(done) {
      var data = {
        id: 16,
        foo: 'bar',
        count: 10
      };

      var namespace = 'luatest';
      client.HMSET(namespace + ':' + data.id, data, function() {
        client.EVAL(lua_delete, 1, namespace, data.id, function() {
          client.EXISTS(namespace + ':' + data.id, function(err, exist) {
            expect(exist).to.be.equal(0);
            done();
          });
        });
      });
    });

  });

});
