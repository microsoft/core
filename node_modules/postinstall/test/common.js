var pify = require('util').promisify;
var fs = require('fs-extra');
var spawn = require('spawn-please');
var Path = require('path');
var glob = pify(require('glob'));
var assert = require('assert');
var postinstall = require('../');

var tmpDir = Path.join(__dirname, "tmp");

exports.checkFiles = function(dir, list) {
	return Promise.all(list.map(function(test) {
		return fs.readFile(Path.join(dir, test.path)).then(function(buf) {
			assert.equal(buf.toString(), test.data);
		});
	}));
};

exports.check = function(dir, pkg, opts) {
	if (!opts) opts = {};
	var commands = postinstall.prepare(pkg.postinstall || {}, opts);
	var countCommands = 0;
	var cwd = opts.cwd || process.cwd();
	return Promise.all(commands.map(function(obj) {
		if (!obj) {
			return;
		}
		if (obj.output.indexOf('*') >= 0) {
			return;
		}
		var dest = Path.resolve(cwd, Path.join(dir, obj.output));
		var count = 0;
		return Promise.resolve().then(function() {
			if (obj.input.endsWith('*')) return glob(Path.join(dest, '*'), {
				nosort: true,
				nobrace: true,
				noglobstar: true,
			});
			else return [dest]
		}).then(function(files) {
			return Promise.all(files.map(function(file) {
				return fs.lstat(file).then(function(stat) {
					count++;
					if (obj.command == "link") {
						assert.ok(stat.isSymbolicLink(), `is symbolic link ${file}`);
					}
				}).catch(function(err) {
					assert.ifError(err);
				});
			})).then(function() {
				assert.ok(count == files.length, `${count} files should have been installed`);
			});
		}).then(function() {
			countCommands++;
		});
	})).then(function() {
		return countCommands;
	});
};

exports.prepare = function() {
	return fs.remove(tmpDir).then(function() {
		return fs.copy(Path.join(__dirname, "fixtures"), tmpDir);
	});
};

exports.cmd = function(dir, cmd) {
	return run(Path.join(tmpDir, dir), cmd);
};

function run(dir, cmd) {
	if (!Array.isArray(cmd)) cmd = [cmd];
	return spawn("npm", cmd, {
		cwd: dir,
		timeout: 10000,
		env: {
			HOME: process.env.HOME,
			PATH: process.env.PATH,
			npm_config_userconfig: '', // attempt to disable user config
			npm_config_ignore_scripts: 'false',
			npm_config_loglevel: 'error',
			npm_config_progress: 'false',
			npm_config_package_lock: 'false',
			npm_config_only: 'prod',
			npm_config_offline: 'true',
			npm_config_audit: 'false'
		}
	}).then(function(out) {
		console.info(out);
		return fs.readFile(Path.join(dir, 'package.json')).then(function(buf) {
			return {dir: dir, pkg: JSON.parse(buf)};
		});
	});
}
