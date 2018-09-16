var fs = require("fs");

module.exports = function(inputs, output, options) {
	var to = fs.createWriteStream(output, {flags: 'a'});
	inputs = inputs.slice();
	return new Promise(function(resolve, reject) {
		write(inputs, to, resolve, reject);
	});
};

function write(files, to, resolve, reject) {
	if (files.length) {
		var readStream = fs.createReadStream(files.shift());
		readStream.pipe(to, {
			end: false
		});
		readStream.on('error', reject)
		readStream.on('end', function() {
			write(files, to, resolve, reject);
		});
	} else {
		to.end();
		resolve();
	}
}

