var Backbone = require('backbone');
var sync = require('../lib/sync');
var expect = require('chai').expect;
var client = require('redis').createClient();

var Car = Backbone.Model.extend({
  namespace: 'car',
  parse: function(json) {
    if (json.year) {
      json.year = parseInt(json.year, 10);
    }
    json.GPS = (json.GPS === 'true');
    return json;
  },
  sync: sync
});

describe('sync', function() {

  describe('#create', function() {

    it('should save in redis', function(done) {
      var car_data = {
        model: 'A1',
        brand: 'Audi',
        color: 'black',
        year: 2013,
        GPS: false
      };
      var car = new Car(car_data);
      car.save().done(function() {
        expect(car.id).is.not.equal(undefined);
        client.hgetall('car:' + car.id, function(err, redis_data) {
          expect(redis_data.model).to.be.equal(car_data.model);
          expect(redis_data.GPS).to.be.equal(car_data.GPS.toString());
          done();
        });
      });
    });

  });

  describe('#read', function() {

    it('should create than fetch with the same id', function(done) {
      var car = new Car({
        brand: 'Renault'
      });

      car.save().done(function() {
        var same_car = new Car({
          id: car.id
        });
        same_car.fetch().done(function() {
          expect(car.get('brand')).to.be.equal(same_car.get('brand'));
          done();
        });
      });
    });

  });

  describe('#update', function() {

    it('should create then update', function(done) {

      var car = new Car({
        brand: 'Renault'
      });

      car.save().done(function() {
        car.save({
          brand: 'Ferrari'
        }).done(function() {
          var same_car = new Car({
            id: car.id
          });
          same_car.fetch().done(function() {
            expect(car.get('brand')).to.be.equal(same_car.get('brand'));
            done();
          });
        });
      });

    });

  });

  describe('#delete', function() {
    it('should create then delete', function(done) {
      var car = new Car({
        brand: 'Lada'
      });

      car.save().done(function() {
        var id = car.id;
        car.destroy().done(function() {
          client.EXISTS('car:' + id, function(err, exists) {
            expect(exists).to.be.equal(0);
            done();
          });
        });
      });

    });
  });



});
