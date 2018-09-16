var path = require("path")
var assert = require("assert")

var mock = require("../index")

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

var res = b()

console.log("res", res)
assert.equal(res, "42 some clowns")
