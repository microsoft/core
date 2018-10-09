
var Slicer = require('../slicepoint.js');
var test = require('tap').test;

function chunkWrite(slicer, chunks) {
  for (var i = 0; i < chunks.length; i++) {
    slicer.write(chunks[i]);
  }
  slicer.end();
}

var param = [
  -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8,
  undefined, null, NaN, Infinity, -Infinity
];

for (var i = 0; i < param.length; i++) {
  for (var j = 0; j < param.length; j++) {
    testSlice(param[i], param[j]);
  }
}

function testSlice(start, end) {
  var expected, print;

  if ('abcdef'.slice(start, end) === '') {
    expected = null;
    print = 'null';
  } else {
    expected = 'abcdef'.slice(start, end);
    print = "'" + 'abcdef'.slice(start, end) + "'";
  }
  
  test("'abcdef'.slice(" + start + "," + end + ") == " + print, function (t) {
    var convert = Slicer(start, end);
    chunkWrite(convert, 'abcdef');

    if (expected === null) {
      t.equal(convert.read(), null);
    } else {
      t.equal(convert.read().toString(), expected);
    }

    t.end();
  });
}
