
var FinanceServer = require('../finance-server.js');
var quotes = require('../../lib/quotes.js');
var test = require('tap').test;

var finance = new FinanceServer();

finance.listen(0, 'localhost', function () {
  test('Only one request is made if no data is read', function (t) {
    quotes('TEST', new Date(0), {
      timeout: 2000,
      interval: 5
    });

    var responses = 0;
    function responseHandler() {
      responses += 1;
    }

    finance.on('response', responseHandler);

    setTimeout(function() {
      finance.removeListener('response', responseHandler);
      t.equal(responses, 1);
      t.end();
    }, 1000);
  });

  test('close finance server', function (t) {
    finance.close(function () {
      t.end();
    });
  });
});
