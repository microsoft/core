
var http = require('http');
var util = require('util');
var events = require('events');
var url = require('url');
var mockney = require('mockney');

var headerP3P = 'policyref="http://info.yahoo.com/w3c/p3p.xml", ' +
      'CP="CAO DSP COR CUR ADM DEV TAI PSA PSD IVAi IVDi CONi TELo OTPi OUR ' +
      'DELi SAMi OTRi UNRi PUBi IND PHY ONL UNI PUR FIN COM NAV INT DEM CNT ' +
      'STA POL HEA PRE LOC GOV"';

function FinanceServer() {
  if (!(this instanceof FinanceServer)) return new FinanceServer();

  var self = this;

  this.server = http.createServer();
  this.server.on('listening', this.emit.bind(this, 'listening'));
  this.server.on('close', this.emit.bind(this, 'close'));

  this.server.on('listening', function () {
    mockney.redirect('ichart.finance.yahoo.com:80', 'localhost:' + self.server.address().port);
  });

  this.server.on('close', function () {
    mockney.restore('ichart.finance.yahoo.com:80');
  });

  this.server.on('request', this._request.bind(this));

  this.endDate = null;
}
util.inherits(FinanceServer, events.EventEmitter);
module.exports = FinanceServer;

function createDate(year, day, month) {
  return new Date(Date.UTC(year, month, day));
}

FinanceServer.prototype._request = function (req, res) {
  var href = url.parse(req.url, true);

  // This do not reflect the real life server
  if (href.pathname !== '/table.csv') {
    res.statusCode = 404;
    return res.end(href.pathname + ' was not found\n');
  }

  // This do not reflect the real life server
  if (href.query.g !== 'd') {
    res.statusCode = 404;
    return res.end('parameter g = ' + href.query.g + ' is not supported\n');
  }

  // This do not reflect the real life server
  if (!href.query.s) {
    res.statusCode = 404;
    return res.end('parameter s must be set\n');
  }

  // This do not reflect the real life server
  var symbol = href.query.s;
  if (symbol !== 'TEST') {
    res.statusCode = 404;
    return res.end('symbol ' + symbol + ' do not exists\n');
  }

  // This should reflect real life, quite close. There are some differences
  // regarding mallformated from dates.

  // set headers
  res.statusCode = 200;
  res.setHeader('P3P', headerP3P);
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('Connection', 'close');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Cache-Control', 'private');

  // Write CSV header
  res.write('Date,Open,High,Low,Close,Volume,Adj Close\n');

  // Convert query parameter intro date objects
  var from = createDate(href.query.c, href.query.b, href.query.a);
  var parsedTo = createDate(href.query.f, href.query.e, href.query.d);
  var to = parsedTo;
  
  if (this.endDate && to.getTime() > this.endDate.getTime()) {
    to = this.endDate;
  }

  // Go from `from` to `to`
  for (var i = new Date(to.getTime()); i.getTime() >= from.getTime(); i.setUTCDate(i.getUTCDate() - 1)) {
    var row = this.getRawRow(i);
    if (row === null) continue;

    res.write(row + '\n');
  }

  // End response
  res.end();

  // Emit response event (symbol, from, to)
  this.emit('response', href.query.s, from, parsedTo);
};

// No stocks on sunday and saturday
var rowSample = [
  null,
  ',90.75,91.56,90.35,90.43,4533600,78.89',
  ',91.00,91.61,90.36,91.28,5063200,79.64',
  ',90.50,91.51,89.70,90.74,7988000,79.16',
  ',91.15,91.42,90.69,91.26,4623400,79.62',
  ',92.00,92.48,90.65,90.65,4260200,79.09',
  null
];

FinanceServer.prototype.stop = function (symbol, date) {
  this.endDate = date;
};

FinanceServer.prototype.getRawRow = function (date) {
  var row = rowSample[date.getDay()];
  if (row === null) return null;

  if (this.endDate && date.getTime() > this.endDate.getTime()) {
    return null;
  }

  return date.toISOString().slice(0, 10) + row;
};

FinanceServer.prototype.getParsedRow = function (date) {
  var row = this.getRawRow(date);
  if (row === null) return null;

  row = row.split(',');

  return {
    date: new Date(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
    adjClose: Number(row[6])
  };
};

FinanceServer.prototype.getParsedRows = function (begin, days, first) {
  var current = new Date(begin.getTime());
  var rows = [];

  for (var i = 0; i <= days; i++) {
    var row = this.getParsedRow(current);
    if (row !== null) rows.push(row);

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return rows;
};

FinanceServer.prototype.listen = function () {
  return this.server.listen.apply(this.server, arguments);
};

FinanceServer.prototype.close = function () {
  return this.server.close.apply(this.server, arguments);
};
