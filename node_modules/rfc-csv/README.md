#rfc-csv

> A valid CSV [RFC-4180](http://tools.ietf.org/html/rfc4180) stream v2 parser

## Installation

```sheel
npm install rfc-csv
```

## Documentation

`rfc-csv` is a `Transform` stream there takes a buffer stream and
outputs an object stream.

```javascript
var fs = require('fs');
var csv = require('rfc-csv');

// Creates a new CSV Transform stream
// The constructor takes one argument `useHeader`. If `useHeader`
// is true the first line will be skiped and a `header` event will be emitted
var parser = csv(true);

// $cat file.csv:
// id,open,end\r\n
// 0,180.73,182.81\r\n
// 1,183.23,183.72\r\n
// 2,182.20,182.27
fs.createReadStream('file.csv').pipe(parser);

// Await header event
parser.once('header', function (header) {
  console.log(header);
});

// Standard Readable stream event
parser.once('readable', function () {

  // Read the first row there is an array of strings
  var row = parser.read();

  // RFC-4180 do not say anything about number type convertion, so that is
  // something you must do, fortunately it is easy.
  row = row.map(Number);

  // Output row there is now an array of number
  console.log(row);
});
```

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
