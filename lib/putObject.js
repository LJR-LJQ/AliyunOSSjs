exports.putObject = putObject;

var http = require('http');

// def
// - objectName
// - contentLength
// - contentType
// - bucketName
// - gmtDate
function putObject(def) {
	var req = http.request({
		method: 'PUT',
		host: def.bucketName + '.oss.aliyuncs.com',
		port: 80,
		path: '/' + def.objectName,
		headers: {
			'Content-Length': def.contentLength,
			'Content-Type': def.contentType,
			'Date': def.gmtDate
		}
	});
	return req;
}

// var req = putObject({
// 	objectName: 'objectName',
// 	contentLength: '4321',
// 	contentType: 'application/octet-stream',
// 	bucketName: 'BucketName',
// 	gmtDate: (new Date).toGMTString()
// });

// console.log(req);