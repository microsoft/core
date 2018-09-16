var path = require("path")
var test = require("tape")

var mock = require("../index")
var b = require("./fixtures/b")

test("simple test", function (assert) {
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

    console.log("# res", res)
    assert.equal(res, "42 some clowns")
    assert.end()
})
