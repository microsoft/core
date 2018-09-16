
var FinanceServer = require('../finance-server.js');
var quotes = require('../../lib/quotes.js');
var test = require('tap').test;
var async = require('async');

var finance = new FinanceServer();

function offsetDate(date, offset) {
  var created = new Date(date.getTime());
      created.setUTCDate(created.getUTCDate() + offset);

  return created;
}

function today() {
  var now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Create a UTC midnight date object set to 11 days in the past
var startDate = offsetDate(today(), -11);
var stopDate = offsetDate(startDate, 20);

function collectRows(stream, total, callback) {
  var rows = [];

  (function flow() {
    var row = null;
    while (rows.length < total) {
      row = stream.read();
      if (row === null) break;
      rows.push(row);    
    }

    if (rows.length === total) {
      return callback(null, rows);
    }

    if (row === null) {
      stream.once('readable', function () {
        flow();
      });
    }
  })();
}

finance.stop('TEST', stopDate);

finance.listen(0, 'localhost', function () {
  test('general test the flow of the qoutes stream', function (t) {

    var stream;
    var lastDate = startDate;
    var expectedRows;
    var first = true;
  
    // track live behaviour
    var nextLive = false;
    var lastRequest = Date.now();

    stream = quotes('TEST', startDate, {
      timeout: 500,
      interval: 5
    });

    (function flow() {
      async.series([
        function (done) {
          finance.once('response', function (symbol, begin, end) {
            t.equal(symbol, 'TEST', 'symbol is TEST');
            t.equal(begin.toString(), lastDate.toString(), 'begin time match');
            t.equal(end.toString(), offsetDate(lastDate, 5).toString(), 'end time match');

            var usedTime = Date.now() - lastRequest;
            if (nextLive) {
              t.ok(usedTime > 450 && usedTime < 550, '500 ms time delay in live mode');
            } else {
              t.ok(usedTime > 0 && usedTime < 100, '0 ms time delay in history mode');
            }

            if (!nextLive & end.getTime() >= Date.now()) {
              nextLive =  true;
            }

            lastRequest = Date.now();

            done(null);
          });
        },

        function (done) {
          expectedRows = finance.getParsedRows(lastDate, 5);
          t.ok(expectedRows.length <= 5, 'less than 6 expected rows');

          if (first === false) {
            expectedRows = expectedRows.slice(1);
          }

          if (expectedRows.length === 0) {
            return done(null);
          }

          lastDate = expectedRows[expectedRows.length - 1].date;

          collectRows(stream, expectedRows.length, function (err, acutalRows) {
            t.deepEqual(acutalRows, expectedRows, 'collected rows matches');
            done(null);
          });
        }
      ], function (err) {
        t.equal(err, null, 'no error');
        first = false;

        if (expectedRows.length  === 0) {
          stream.close();
          return t.end();
        }

        flow();
      });
    })();
  });

  test('close finance server', function (t) {
    finance.close(function () {
      t.end();
    });
  });
});
