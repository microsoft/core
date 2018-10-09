
var util = require('util');
var stream = require('stream');

var CRLF = /\r?\n/g;

function Linepoint(chars) {
  if (!(this instanceof Linepoint)) return new Linepoint(chars);

  stream.Transform.call(this);

  if (typeof chars !== 'string') {
    throw new Error('first argument must be a string');
  }

  this._chars = chars;
  this._lastCR = '';
}
module.exports = Linepoint;
util.inherits(Linepoint, stream.Transform);

Linepoint.prototype._transform = function (chunk, encodeing, done) {
  chunk = this._lastCR + chunk.toString();
  chunk = chunk.replace(CRLF, this._chars);
  
  // If the last char is \r then it might be followed by a \n char
  // so hold that char back and use it in the next chunk
  if (chunk.charCodeAt(chunk.length - 1) === 13) {
    this._lastCR = '\r';
    this.push(chunk.slice(0, -1));
  } else {
    this._lastCR = '';
    this.push(chunk);
  }

  done(null);
};

// End of stream, output \r if stream ended with that char
Linepoint.prototype._flush = function (done) {
  if (this._lastCR) {
    this.push(this._lastCR);
  }

  done(null);
};
