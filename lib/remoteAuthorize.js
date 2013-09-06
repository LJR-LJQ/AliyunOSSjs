exports.remoteAuthorize = remoteAuthorize;

var http = require('http');

var safeCall = require('./safeCall').safeCall;

function remoteAuthorize(url, info, scb, fcb) {
	if (!checkArgs()) return;

	var req;

	req = http.request(url);
	req.method = 'POST';
	req.on('response', onResponse);
	req.on('error', onError);

	var text = JSON.stringify(info);
	req.setHeader('Content-Type', 'application/json;charset=UTF-8');
	req.setHeader('Content-Length', Buffer.byteLength(text, 'utf8'));

	req.end(text);

	function onResponse(res) {
		var chunks = [],
			totalLength = 0;

		res.on('data', onData);
		res.on('end', onEnd);
		res.on('error', onError);

		function onData(chunk) {
			chunks.push(chunk);
			totalLength += chunk.length;
		}

		function onEnd() {
			if (res.statusCode !== 200) {
				safeCall(fcb);
				return;
			}

			try {
				var obj = JSON.parse(Buffer.concat(chunks, totalLength).toString());
				safeCall(scb, [obj]);
			} catch(err) {
				console.log('[remoteAuthorize] ' + err.toString());
				safeCall(fcb);
			}
		}

		function onError(err) {
			console.log('[remoteAuthorize] ' + err.toString());
			safeCall(fcb);
		}
	}

	function onError(err) {
		console.log('[remoteAuthorize] ' + err.toString());
		safeCall(fcb);
	}

	function checkArgs() {
		if (typeof url !== 'string' || url === '') {
			safeCall(fcb);
			return false;
		}

		if (typeof info !== 'object' || info === null) {
			safeCall(fcb);
			return false;
		}

		return true;
	}
}

// var o = {
// 		verb: 'PUT',
// 		contentMd5: 'c8fdb181845a4ca6b8fec737b3581d76',
// 		contentType: 'text/html',
// 		date: 'Thu, 17 Nov 2005 18:49:58 GMT',
// 		canonicalizedOSSHeaders: 'x-oss-magic:abracadabra\nx-oss-meta-author:foo@bar.com\n',
// 		canonicalizedResource: '/oss-example/nelson'
// 	};

// var url = 'http://miaodeli.com';

// remoteAuthorize(url, o, function(result) {
// 	console.log(result);
// }, function() {
// 	console.log('failed');
// });