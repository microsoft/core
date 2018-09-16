
var CSV = require('../csv.js');
var Collect = require('./collect.js');
var test = require('tap').test;

test('no header, two rows, one chunk', function (t) {
  var store = Collect();
  var parser = CSV(false);
      parser.pipe(store);

  store.once('finish', function () {
    t.equal(store.header, null);
    t.deepEqual(store.rows, [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ]);
    t.end();
  });

  parser.write('a,b,c\r\nd,e,f');
  parser.end();
});

test('no header, two rows, state chunks', function (t) {
  var store = Collect();
  var parser = CSV(false);
      parser.pipe(store);

  store.once('finish', function () {
    t.equal(store.header, null);
    t.deepEqual(store.rows, [
      ['', '', 'ab'],
      ['a",\r\n', '', '']
    ]);
    t.end();
  });
  
  // Test unescaped cells
  parser.write(',');
  parser.write(',');
  parser.write('a');
  parser.write('b');
  parser.write('\r');
  parser.write('\n');
  
  // Test escaped cells
  parser.write('"');
  parser.write('a');
  parser.write('"');
  parser.write('",');
  parser.write('\r');
  parser.write('\n');
  parser.write('"');
  parser.write(',"');
  parser.write('",');
  
  parser.end();
});

test('no header, zero rows', function (t) {
  var store = Collect();
  var parser = CSV(false);
      parser.pipe(store);

  store.once('finish', function () {
    t.equal(store.header, null);
    t.deepEqual(store.rows, []);
    t.end();
  });

  parser.end();
});

test('header, zero rows', function (t) {
  var store = Collect();
  var parser = CSV(true);
      parser.pipe(store);

  store.once('finish', function () {
    t.deepEqual(store.header, ['a', 'b', 'c']);
    t.deepEqual(store.rows, []);
    t.end();
  });
  
  parser.write('a,b,c');
  parser.end();
});

test('header, one row', function (t) {
  var store = Collect();
  var parser = CSV(true);
      parser.pipe(store);

  store.once('finish', function () {
    t.deepEqual(store.header, ['a', 'b', 'c']);
    t.deepEqual(store.rows, [
      ['1', '2', '3']
    ]);
    t.end();
  });
  
  parser.write('a,b,c\r\n1,2,3');
  parser.end();
});

test('header, no data', function (t) {
  var store = Collect();
  var parser = CSV(true);
      parser.pipe(store);

  store.once('finish', function () {
    t.deepEqual(store.header, null);
    t.deepEqual(store.rows, []);
    t.end();
  });
  
  parser.end();
});
