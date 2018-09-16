
var util = require("util");
var stream = require('stream');

var remote = require('./remote.js');

var HALF_DAY = 1000 * 60 * 60 * 12;
var HALF_YEAR = 30 * 6;

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isNumber(value) {
  return typeof value === 'number' && isFinite(value);
}

function Quotes(symbol, since, options) {
  if (!(this instanceof Quotes)) return new Quotes(symbol, since, options);

  var self = this;

  stream.Readable.call(this, {
    objectMode: true
  });

  if (typeof symbol !== 'string') {
    throw new TypeError('Company symbol must be a string');
  }

  if (!(since instanceof Date)) {
    throw new TypeError('Start sate mush be a Date object');
  }
  
  // Default options to empty object
  if (options === undefined) options = {};
  
  if (isObject(options) === false) {
    throw new TypeError('options must be an object');
  }

  // Do type validation on options
  if (options.hasOwnProperty('timeout') && isNumber(options.timeout) === false) {
    throw new TypeError('timeout must be a number');
  }
  
  if (options.hasOwnProperty('interval') && isNumber(options.interval) === false) {
    throw new TypeError('interval must be a number');
  }

  // Setup static settings object
  this._settings = {
    'symbol': symbol,

    'timeout': options.hasOwnProperty('timeout') ?
      options.timeout : HALF_DAY,

    'interval': options.hasOwnProperty('interval') ?
      options.interval : HALF_YEAR
  };

  // Dynamic variables
  //
  // `lastDate` contains the last date row send, except for the first row
  // indicated by `first`. This helps preventing the same date from being
  // send twice and helps maintaining a start date when doing a remote request.
  this._lastDate = since;
  this._first = true;
  // If `live` is true the specified timeout will need to elapsed before a new
  // remote request is made
  this._live = false;

  // Simple event handler used for reference later
  this._handler = {
    error: function (err) {
      self.emit('error', err);
    }
  };

  // Create fetch stream for the first time
  this._needPush = false;
  this._isClose = false;
  this._fetch = null;
  this._remote();
}
util.inherits(Quotes, stream.Readable);
module.exports = Quotes;

Quotes.prototype._read = function (n) {
  var self = this;

  this._needPush = false;

  var row = this._fetch.read();
  if (row === null) {
    this._needPush = true;
    this._fetch.once("readable", function () {
      self._read();
    });
    return;
  }

  // Update the `lastDate` property
  this._lastDate = row.date;

  // Push row, if returned value is true more data should be pushed
  this.push(row);
};

function offsetDate(date, days) {
  var next = new Date(date.getTime());
      next.setUTCDate(next.getUTCDate() + days);
  return next;
}

Quotes.prototype._remote = function (first) {
  var self = this;

  // Cleanup event handlers from previous stream
  if (this._fetch !== null) {
    this._fetch.removeListener('error', this._handler.error);
  }

  var begin = this._lastDate;
  var end = offsetDate(this._lastDate, this._settings.interval);

  // Starts out by being a history stream and becomes a live pulling stream
  this._fetch = remote(this, begin, end);

  if (self._needPush === true) {
    self._fetch.once("readable", function () {
      self._read();
    });
  }

  // Relay error events
  this._fetch.on('error', this._handler.error);

  // Create a new fetch stream and set live falg if relevant
  this._fetch.once('end', function () {
    if (self._isClose) return;

    // If end date is after now, then we can switch to live mode
    if (!self._live && end.getTime() >= Date.now()) {
      self._live = true;
    }
    
    // Set first to false to data won't be dublicated, this is to zero data from
    // being send from remote resulting in a 404 page.
    self._first = false;
    self._remote();
  });
};

Quotes.prototype.close = function () {
  this.push(null);
  this._isClose = true;
  this._fetch = null;
};
