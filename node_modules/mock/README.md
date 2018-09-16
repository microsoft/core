# mock

[![build status][1]][2]

[![browser support][3]][4]

Load a module with it's require's mocked out

Works in both node and browserify

## Example

```js
var realB = require("./fixtures/b")

var b = mock("./fixtures/b", {
    fs: {
        readFileSync: function (uri) {
            if (uri === "clowns.txt") {
                return "some clowns"
            }
        }
    }
    , "./fixtures/c": null
    , "./fixtures/a": function () {
        return 42
    }
}, require)

// use b. It's reference to fs and fixtures/a have been replaced with
// your passed objects
```

Limitations:

 - You have to require the thing your mocking out or browserify
    won't load it and all it's dependencies into the bundle.
 - When you set a dependency to null your saying don't overload
    that dependency with this value, but do nuke it from the cache.
    This is useful when you want to mock out something ./fixtures/c
    depends on but not touch the implementation of ./fixtures/c

## Installation

`npm install mock`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Colingo/mock.png
  [2]: http://travis-ci.org/Colingo/mock
  [3]: http://ci.testling.com/Colingo/mock.png
  [4]: http://ci.testling.com/Colingo/mock
