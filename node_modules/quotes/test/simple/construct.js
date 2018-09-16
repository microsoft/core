
var FinanceServer = require('../finance-server.js');
var quotes = require('../../lib/quotes.js');
var test = require('tap').test;
require('trace');

var ONE_DAY = 1000 * 60 * 60 * 24;
var HALF_YEAR = 30 * 6;

var finance = new FinanceServer();
finance.listen(0, 'localhost', function () {
  
  test('default options', function (t) {
    var stream = quotes('TEST', new Date(0));

    t.equal(stream._settings.timeout, (ONE_DAY / 2));
    t.equal(stream._settings.interval, HALF_YEAR);
    
    finance.once('response', function () {
      t.end();
    });
  });

  test('set options are stored', function (t) {
    var stream = quotes('TEST', new Date(0), {
      timeout: 2000,
      interval: 5
    });
    
    t.equal(stream._settings.timeout, 2000);
    t.equal(stream._settings.interval, 5);
    finance.once('response', function () {
      t.end();
    });
  });

  test('wrong symbol', function (t) {
    try {
      quotes(null);
    } catch (e) {
      t.equal(e.message, 'Company symbol must be a string');
      t.end();
    }
  });

  test('wrong date', function (t) {
    try {
      quotes('TEST', null);
    } catch (e) {
      t.equal(e.message, 'Start sate mush be a Date object');
      t.end();
    }
  });

  test('timeout not a number', function (t) {
    try {
      quotes('TEST', new Date(0), {
        timeout: null
      });
    } catch (e) {
      t.equal(e.message, 'timeout must be a number');
      t.end();
    }
  });

  test('timeout is infinity', function (t) {
    try {
      quotes('TEST', new Date(0), {
        timeout: Infinity
      });
    } catch (e) {
      t.equal(e.message, 'timeout must be a number');
      t.end();
    }
  });

  test('interval not a number', function (t) {
    try {
      quotes('TEST', new Date(0), {
        interval: null
      });
    } catch (e) {
      t.equal(e.message, 'interval must be a number');
      t.end();
    }
  });

  test('interval is infinity', function (t) {
    try {
      quotes('TEST', new Date(0), {
        interval: Infinity
      });
    } catch (e) {
      t.equal(e.message, 'interval must be a number');
      t.end();
    }
  });

  test('close finance server', function (t) {
    finance.close(function () {
      t.end();
    });
  });
});
