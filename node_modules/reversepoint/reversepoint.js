
var util = require('util');
var stream = require('stream');

function Reversepoint() {
  if (!(this instanceof Reversepoint)) return new Reversepoint();

  stream.Transform.call(this, {
    objectMode: true
  });

  this._data = [];
}
module.exports = Reversepoint;
util.inherits(Reversepoint, stream.Transform);

Reversepoint.prototype._transform = function (object, encodeing, done) {
  this._data.push(object);

  done(null);
};

Reversepoint.prototype._flush = function (done) {
  for (var i = 0, l = this._data.length; i < l; i++) {
    this.push(this._data.pop());
  }

  done(null);
};
