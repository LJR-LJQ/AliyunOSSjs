exports.fileMd5 = fileMd5;

var fs = require('fs'),
	createHash = require('crypto').createHash,
	safeCall = require('./safeCall').safeCall;

// # scb(result, fileSize)
// # fcb()
function fileMd5(fileName, scb, fcb) {
	try {
		var fileSize = 0;
		var md5 = createHash('md5');
		var rs = fs.createReadStream(fileName);
		rs.on('data', onData);
		rs.on('end', onEnd);
		rs.on('error', onError);
	} catch(err) {
		console.log(err.toString());
		safeCall(fcb);
	}

	function onData(chunk) {
		fileSize += chunk.length;
		md5.update(chunk);
	}

	function onEnd() {
		var hex = md5.digest('hex');
		safeCall(scb, [hex, fileSize]);
	}

	function onError(err) {
		console.log('[fileMd5] ' + err.toString());
		safeCall(fcb);
	}
}

// var fileName = 'D:/TDDownload/VS2010UltimTrial_4PartsTotal.part2.rar';
// fileMd5(fileName, function(hex) {
// 	console.log(hex);
// }, function() {
// 	console.log('failed');
// });