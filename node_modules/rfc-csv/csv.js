
var util = require('util');
var stream = require('stream');

var DOUBLE_DQOUTE = /""/g;

function CSV(hasHeader) {
  if (!(this instanceof CSV)) return new CSV(hasHeader);

  stream.Transform.call(this, {
    objectMode: true
  });

  this._hasHeader = !!hasHeader;
  
  this._dataWriten = false;
  this._currentRow = [];
  this._currentCell = '';

  this._flagEscaped = false;
  this._flagQoute = false;
  this._flagNewCell = true;
}
module.exports = CSV;
util.inherits(CSV, stream.Transform);

CSV.prototype._transform = function (chunk, encodeing, done) {
  this._dataWriten = true;

  chunk = chunk.toString();
  
  var start = 0;

  for (var i = 0, l = chunk.length; i < l; i++) {
    var sign = chunk.charCodeAt(i);
    
    // Detect if next cell is an escaped cell
    if (this._flagNewCell) {
      this._flagNewCell = false;

      // if `"` then its an escaped cell
      if (sign === 34) {
        this._flagEscaped = true;
        continue;
      }
    }

    // Manage dqoute in escaped cell
    if (this._flagEscaped) {
      if (sign === 34) {
        this._flagQoute = !this._flagQoute;
        continue;
      }
    }

    // In an escaped cell the termination must be after a `"`
    // In an unescaped cell the termination can happen at any point
    if ((this._flagEscaped && this._flagQoute) || !this._flagEscaped) {
      switch (sign) {
        case 44: //,
          this._doneCell(this._currentCell + chunk.slice(start, i));
          start = i + 1;
          break;
        case 10: // \n
          this._doneCell((this._currentCell + chunk.slice(start, i)).slice(0, -1));
          start = i + 1;
          this._doneRow();
          break;
      }
    }
  }
  
  // Chunk parsing done store the current cell
  this._currentCell += chunk.slice(start, i);

  done(null);
};

CSV.prototype._doneCell = function (cell) {
  // If its an escaped cell then remove the sounding qoutes and replace "" with "
  if (this._flagEscaped) {
    cell = cell.slice(1, -1).replace(DOUBLE_DQOUTE, '"');
  }

  // Add cell to row and reset cell flags
  this._currentRow.push(cell);
  this._currentCell = '';
  this._flagEscaped = false;
  this._flagQoute = false;
  this._flagNewCell = true;
};

CSV.prototype._doneRow = function () {
  // If headers are requested emit the header event
  if (this._hasHeader === true) {
    this._hasHeader = false;
    this.emit('header', this._currentRow);
  }
  // Otherwice just push the data array
  else {
    this.push(this._currentRow);
  }

  this._currentRow = [];
};

// End of stream, the current row is done
CSV.prototype._flush = function (done) {
  if (this._dataWriten) {
    this._doneCell(this._currentCell);
    this._doneRow();
  }
  done(null);
};
