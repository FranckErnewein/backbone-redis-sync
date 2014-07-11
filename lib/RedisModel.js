var Backbone = require('backbone');

function subscribe() {

}

module.exports = Backbone.Model.extend({
  sync: require('./sync'),
  subscribe: subscribe
});
