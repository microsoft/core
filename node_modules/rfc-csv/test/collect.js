
var util = require('util');
var stream = require('stream');

function Collect() {
  if (!(this instanceof Collect)) return new Collect();
  
  var self = this;
  
  stream.Writable.call(this, {
    objectMode: true
  });
  
  this.header = null;
  this.rows = [];
  
  this.once('pipe', function (source) {
    source.once('header', function (row) {
      self.header = row;
    });
  });
}
module.exports = Collect;
util.inherits(Collect, stream.Writable);

Collect.prototype._write = function (row, encoding, callback) {
  this.rows.push(row);
  callback(null);
};
