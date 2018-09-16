
var Slicer = require('../slicepoint.js');
var test = require('tap').test;

function chunkWrite(slicer, chunks) {
  for (var i = 0; i < chunks.length; i++) {
    slicer.write(chunks[i]);
  }
  slicer.end();
}

test('slice 1 byte of the tail on a zero byte stream', function (t) {
  var convert = Slicer(0, -1);
  chunkWrite(convert, '');

  t.equal(convert.read(), null);
  t.end();
});

test('keep first byte on a zero byte stream', function (t) {
  var convert = Slicer(0, 1);
  chunkWrite(convert, '');

  t.equal(convert.read(), null);
  t.end();
});

test('slice first byte on a zero byte stream', function (t) {
  var convert = Slicer(1);
  chunkWrite(convert, '');

  t.equal(convert.read(), null);
  t.end();
});

test('keep last byte on a zero byte stream', function (t) {
  var convert = Slicer(-1);
  chunkWrite(convert, '');

  t.equal(convert.read(), null);
  t.end();
});
