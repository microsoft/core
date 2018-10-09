
var util = require('util');
var stream = require('stream');

var zeroBuffer = new Buffer(0);

function Slicepoint(start, end) {
  if (!(this instanceof Slicepoint)) return new Slicepoint(start, end);

  stream.Transform.call(this);

  // String.prototype.slice does type convertion of its inputs and
  // NaN becomes 0. Only if end is undefined is there a special case.
  this._start = (start === -Infinity) ? 0 : Math.floor(Number(start) || 0);
  this._end = (end === undefined || end === Infinity) ? null : Math.floor(Number(end) || 0);

  // If the returned part is a tail part of a stream then we can't
  // know in advance if a chunk should be returned, so it is stored here
  // until it is known
  this._tailBuffer = zeroBuffer;
  this._tailPosition = 0;
  // - This is a negative number used in Buffer.prototype.slice
  this._tailSize = (this._end === null) ? Math.min(this._start, 0) : Math.min(this._start, this._end, 0);

  // If a head or the tail should be skiped it is necessary to known
  // how much data there has been written to this stream
  this._consumed = 0;

  // Predecide if a part of the head and the tail can be removed
  this._sliceHead = (this._start > 0 || this._end > 0);
  this._sliceTail = (this._start < 0 || this._end < 0);

  // Some cases of slice are known to never return anything
  this._stopOutput = false;

  // There are some cases where it is known in advance that no
  // data can be outputted
  // - If start is Infinity then we can never write something
  if (this._start === Infinity) {
    this._neverOutput = true;
    return this;
  }
  // - If end isn't set we can most likely write something
  if (this._end === null) return this;
  // - If end is -Infinity
  // - If end is zero
  // - If start and end position are the same
  // - If counting from the end, end comes before start
  // - If counting from the start, start comes after end
  if ((this._end === -Infinity) ||
      (this._end === 0) ||
      (this._start === this._end) ||
      (this._start < 0 && this._end < 0 && this._end < this._start) ||
      (this._start > 0 && this._end > 0 && this._start > this._end)) {
    this._neverOutput = true;
  }
}
module.exports = Slicepoint;
util.inherits(Slicepoint, stream.Transform);

Slicepoint.prototype._transform = function (chunk, encodeing, done) {
  // Count the consumed data
  var consumed = this._consumed;
  this._consumed += chunk.length;

  // Sometimes the state means that no data will ever be writen
  // and that state will never change
  // - No data can ever be writen
  // - If the amout of consumed data is beond or at the the slice end
  if (this._neverOutput || (this._end > 0 && this._end <= consumed)) {
    return done(null);
  }

  // Add what was thought to be the tail to the begining of the incomming chunk
  var output = Buffer.concat([this._tailBuffer, chunk]);

  // counting form the begining of the stream
  var headSliceStart = 0;
  var headSliceEnd = output.length;
  if (this._sliceHead) {
    // - A part of the head should be removed
    if (this._start > 0) {
      // If head hasn't been removed yet, calculate the slice start
      if (consumed < this._start) {
        headSliceStart = this._start - consumed;
      }
    }

    // - A part of the tail should be removed. Note that it is never safe
    // to remove something from the end if something related to the tail is
    // unknown.
    if (this._end > 0 && this._sliceTail === false) {
      // If tail hasn't been removed yet, calculate the slice end
      // This is always the case when this line is hit, because there is an
      // early check for the other case `this._end <= consumed`.
      headSliceEnd = this._end - consumed;
    }

    // - Slice the buffer now that `start` and `end` has been calculated
    output = output.slice(headSliceStart, headSliceEnd);
  }
  
  // counting form the end of the stream
  if (this._sliceTail) {
    // Cut of the max tail from the output buffer
    this._tailPosition = Math.max(consumed + chunk.length - Math.min(output.length, Math.abs(this._tailSize)), 0);
    this._tailBuffer = output.slice(this._tailSize);

    // Don't output data yet if the slice start is counting from the end
    if (this._start < 0) {
      output = zeroBuffer;
    } else {
      output = output.slice(0, this._tailSize);
    }
  }

  // Send buffer to output
  this.push(output);
  done(null);
};

Slicepoint.prototype._flush = function (done) {
  // No data can ever be writen, stop here
  if (this._neverOutput) {
    return done(null);
  }
  
  // counting form the end of the stream
  if (this._sliceTail) {
    // - A part of the head should be removed
    var tailSliceStart = 0;
    if (this._start < 0) {
      // Convert the slice start to a positive value
      tailSliceStart = (this._consumed + this._start) - this._tailPosition;
    }

    // - A part of the tail should be removed
    var tailSliceEnd = this._tailBuffer.length;
    if (this._end < 0) {
      tailSliceEnd = (this._consumed + this._end) - this._tailPosition;
    }
    
    // Is begin after end?
    if (this._end > 0) {
      tailSliceEnd = this._end - this._tailPosition;
    }
    
    // All slice values should now be postive, if they aren't it means
    // that they are before the tail (dude to a small stream) and they
    // should just be set to zero.
    if (tailSliceStart < 0) tailSliceStart = 0;
    if (tailSliceEnd < 0) tailSliceEnd = 0;
    
    // - Slice the buffer now that `start` and `end` has been calculated
    this.push(this._tailBuffer.slice(tailSliceStart, tailSliceEnd));
    this._tailBuffer = null;
  }

  done(null);
};
