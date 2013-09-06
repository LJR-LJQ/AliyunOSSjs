exports.uploadFile = uploadFile;

var fs = require('fs'),
	path = require('path');

var safeCall = require('./safeCall').safeCall,
	putObject = require('./putObject').putObject,
	fileMd5 = require('./fileMd5').fileMd5,
	Uploader = require('./uploader');

// # signCb(req, contentMd5)
// # scb(uploader)
// # fcb()
// 
// uploader
// - start()
// - stop()
// - finish 回调函数
// - working 布尔值
// - uploadedBytes 数值
// - totalBytes 数值
function uploadFile(fileName, signCb, scb, fcb) {
	// 必须要有签名回调函数
	if (typeof signCb !== 'function') {
		safeCall(fcb);
		return;
	}

	// 首先计算一下文件的 MD5 值，顺便也能够获得文件大小
	fileMd5(fileName, fileMd5Scb, fcb);

	function fileMd5Scb(md5HexText, fileSize) {

		// var info = {
		// 	verb: 'PUT',
		// 	contentMd5: md5HexText,
		// 	contentType: 'application/octet-stream',
		// 	date: (new Date()).toGMTString(),
		// 	canonicalizedOSSHeaders: '',
		// 	canonicalizedResource: getCanonicalizedResource(req)
		// };

		// 根据规范需要填写填写请求中的各个部分
		var totalBytes = fileSize;
		var objectName = path.basename(fileName);
		var bucketName = 'miaodeli-oss';
		var contentType = 'application/octet-stream';
		var gmtDate = (new Date()).toGMTString();

		var req = putObject({
			objectName: objectName,
			bucketName: bucketName,
			contentType: contentType,
			gmtDate: gmtDate,
			contentLength: totalBytes
		});
		
		// 补充 MD5 部分
		req.setHeader('Content-MD5', md5HexText);

		// 请求构造好了，需要签名一下
		signCb(req, md5HexText, signSuccess, signFailure);

		function signSuccess(req) {
			var fileReadStream = fs.createReadStream(fileName);
			var uploader = Uploader.create(fileReadStream, req);
			safeCall(scb, [uploader]);
		}

		function signFailure() {
			safeCall(fcb);
		}
	}
}

