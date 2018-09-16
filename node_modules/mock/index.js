var moduleRequire = require
var Module

try {
    Module = (require)("module")
} catch (err) {
    /* ignore */
}

module.exports = mock

function mock(name, mocks, require) {
    require = require || moduleRequire

    var moduleUri = require.resolve(name)

    if (!Array.isArray(mocks)) {
        mocks = Object.keys(mocks).map(function (key) {
            return {
                uri: key
                , value: mocks[key]
            }
        })
    }

    var old = mocks.reduce(function (acc, item) {
        var uri = item.uri
        var impl = item.value
        var mockUri = require.resolve(uri)
        var oldImpl = require.cache[mockUri]

        if (impl === null) {
            delete require.cache[mockUri]
        } else {
            require.cache[mockUri] = {
                "exports": impl
            }

            if (Module && Module._cache) {
                Module._cache[mockUri] = {
                    "exports": impl
                }
            }
        }

        acc[uri] = oldImpl
        return acc
    }, {})

    var impl = getModule(moduleUri)

    Object.keys(old).forEach(function (key) {
        var impl = old[key]
            , mockUri = require.resolve(key)

        require.cache[mockUri] = impl

        if (Module && Module._cache) {
            Module._cache[mockUri] = impl
        }
    })

    return impl
}

function getModule(moduleUri) {
    if (require.modules) {
        var constr = require.modules[moduleUri]
        return constr()
    } else {
        var old = require.cache[moduleUri]
        ;delete require.cache[moduleUri]
        var impl = require(moduleUri)
        require.cache[moduleUri] = old
        return impl
    }
}
