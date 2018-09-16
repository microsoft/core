
var Reversepoint = require('./reversepoint.js');
var test = require('tap').test;

test('two writes', function (t) {
  var inspect = Reversepoint();
      inspect.write(1);
      inspect.write(2);
      inspect.end();
  
  t.equal(inspect.read(), 2);
  t.equal(inspect.read(), 1);
  t.end();
});

test('one write', function (t) {
  var inspect = Reversepoint();
      inspect.write(1);
      inspect.end();
  
  t.equal(inspect.read(), 1);
  t.end();
});

test('no write', function (t) {
  var inspect = Reversepoint();
      inspect.end();
  
  t.equal(inspect.read(), null);
  t.end();
});
