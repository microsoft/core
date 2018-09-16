var fs = require("fs")

module.exports = function () {
    return fs.readFileSync("clowns.txt")
}
