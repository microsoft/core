#qoutes

> A continues stream of qoutes for each day.

## Installation

```sheel
npm install qoutes
```

## Example

```javascript
var quotes = require('quotes');
var inspectpoint = require('inspectpoint');

// Stream qoutes since 2013-01-01 from IBM until now and beyond
quotes('IBM', new Date('2013-01-01'))
  .pipe(inspectpoint({colors: true}))
  .pipe(process.stdout);
```

## Documentation

`qoutes` is a standard Readable stream. It pulls qoutes from Yahoo Finance for
a given symbol, since a specified date. When all data from the past is collected
it will begin to do live pulling, so new data will be send to you when available.

```javascript
var qoutes = require('qoutes');
```

### stream = qoutes(symbol, since, [options])

* `symbol` is the company symbol (not name).
* `since` is a `Date` object specifying from when the data stream should start.
* `options` is an object, it can contain the following properties:
  * `timeout` is a number given in milliseconds. Because Yahoo don't support a
    streaming interface `qoutes` performs pulling using HTTP request. When fetching
    data from the past, this will go as fast as you can read it, but once the data
    becomes live there is a delay between each HTTP request. This delay is defined
    by this property. (Default is `43200000` = 12 hour)
  * `interval` is a number given in days. Because data from Yahoo is outputted in
    a now = first past = last order, it can not be stream parsed and piped. Instead
    it is stored internally and then reversed. This means that there will be a high
    memory usage for large amount of data. To prevent this `qoutes` fetches the data
    in small interval. This internal is given by this propery. (Default is `180` = ½ year)
    **Do not set this to anything less than 5**, this is to prevent getting stocked in
    periodes where the stock market is closed.

```javascript
// !! Very expencive
var stream = quotes('IBM', new Date('2013-01-01'), {
  timeout: 2000,
  interval: 5
});
```

### stream.read()

`qoutes` is a standard Readable stream, and supports all the methods and events
there are to follow. The read data there can also be piped are objects with the
following format:

```javascript
{
  date: Date,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  adjClose: Number
}
```

### stream.close()

To stop the data flow and the HTTP pulling, simply call this method. Note that
the `end` event will be followed by this call.

```javascript
stream.close();
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
