var uploadFile = require('./lib/uploadFile').uploadFile,
	safeCall = require('./lib/safeCall').safeCall;

var fileName = 'test.jpg';
uploadFile(fileName, signReq, scb, fcb);

function scb(uploader) {
	uploader.onFinish = function() {
		console.log('finish.');
	}

	uploader.onError = function(err) {
		console.log('upload error: ' + err.toString());
	}

	uploader.onSpeed = function(sended, speed) {
		console.log(speed / 1024 + ' KB/s');
	}

	// 开始上传
	uploader.start();
	uploader.enableSpeedCallback();
}

function fcb() {
	console.log('upload failed');
}

// # scb(req)
// # fcb()
function signReq(req, contentMd5, scb, fcb) {
	var remoteAuthorize = require('./lib/remoteAuthorize').remoteAuthorize;

	var obj = {
		verb: req.method,
		contentMd5: contentMd5,
		contentType: req.getHeader('content-type'),
		date: req.getHeader('date'),
		canonicalizedOSSHeaders: getCanonicalizedOSSHeaders(req),
		canonicalizedResource: getCanonicalizedResource(req)
	};

	remoteAuthorize('http://miaodeli.com', obj, remoteAuthorizeSuccess, remoteAuthorizeFailure);

	function remoteAuthorizeSuccess(auth) {
		if (auth.error) {
			safeCall(fcb);
			return;
		}

		req.setHeader('Authorization', auth.Authorization);

		// 通知上级已经完成签名
		safeCall(scb, [req]);
	}

	function remoteAuthorizeFailure() {
		safeCall(fcb);
	}
}

function getCanonicalizedOSSHeaders(req) {
	var ossHeaderList = [],
		_headers = req._headers || {};

	// _headers 中字段名全部都是小写的，因此不用我们转换
	for (var header in _headers) {
		if (/^x-oss-/.test(header)) {
			// 只需把名字加入集合即可，值一会儿再取
			ossHeaderList.push(header);
		}
	}

	if (ossHeaderList.length < 1) return '';

	// 排序一下
	ossHeaderList = ossHeaderList.sort();

	// 开始构造最终的字符串了
	ossHeaderList = ossHeaderList.map(function(header) {
		return header + ':' + _headers[header] + '\n';
	});

	return ossHeaderList.join('');
}

function getCanonicalizedResource(req) {
	// 这里的实现不完整，只能应付一小部分情况
	var host = req.getHeader('host');
	var reqPath = req.path;
	var result = '/' + host.substring(0, host.indexOf('.')) + reqPath;
	return result;
}