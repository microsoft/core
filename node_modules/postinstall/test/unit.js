var common = require('./common');
var assert = require('assert');

describe("Unit tests", function suite() {
	this.timeout(10000);
	before(function() {
		return common.prepare();
	});

	after(function() {

	});

	it("should install local file link and copy", function() {
		return common.cmd("local-file", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg).then(function() {
				return common.checkFiles(dir, [{
					path: 'dest/bundle.js',
					data: "// one\n// two\n"
				}, {
					path: 'dest/three.min.css',
					data: "/* three */\n"
				}, {
					path: 'dest/four.min.css',
					data: "/* four */\n"
				}, {
					path: 'dest/texts.txt',
					data: "text2\ntext1\n"
				}, {
					path: 'dest/rec/other.js',
					data: "// something\n"
				}, {
					path: 'dest/rec/dir/deep/test.js',
					data: "console.log('test.js')\n"
				}]);
			});
		});
	});

	it("should install dependency file link", function() {
		return common.cmd("dep-file", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg);
		});
	});

	it("should install scoped dependency file link", function() {
		return common.cmd("scoped-dep-file", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg);
		});
	});

	it("should install dependency wildcard link", function() {
		return common.cmd("dep-wildcard", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg);
		});
	});

	it("should install dependency file installed within dependency", function() {
		return common.cmd("dep-dep-file", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg);
		}).then(function() {
			return common.cmd("dep-dep-file", "update").then(function({dir, pkg}) {
				return common.check(dir, pkg);
			});
		});
	});

	it("should throw when nothing matches", function() {
		var err = null;
		return common.cmd("throw", "install").catch(function(ex) {
			err = ex;
		}).then(function(what) {
			if (!err) throw new Error("Did not throw");
		});
	});

	it("should not execute not whitelisted commands", function() {
		return common.cmd("whitelist", "install").then(function({dir, pkg}) {
			return common.check(dir, pkg, {allow: ['link']}).then(function(count) {
				assert.equal(1, count); // 1 because the star is not yet checked
			});
		});
	});

	it("should run postinstall module with cwd set properly", function() {
		return common.cmd("ignore-scripts", ["install", "--ignore-scripts"]).then(function({dir, pkg}) {
			var cwd = './test/tmp/ignore-scripts';
			return require('../').process(require('./tmp/ignore-scripts/package.json').postinstall, {
				cwd: cwd
			}).then(function() {
				return common.check(dir, pkg, {cwd: cwd}).then(function(count) {
					assert.equal(1, count);
				});
			});
		});
	});

});
