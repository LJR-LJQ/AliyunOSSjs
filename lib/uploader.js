exports.create = create;

var safeCall = require('./safeCall').safeCall;

function create(readStream, writeStream) {
	return new Uploader(readStream, writeStream);
}

// # onStart()
// # onSpeed(bytesSended, speed) 每秒传输字节量
// # onStop()
// # onFinish()
// # onError(err)
function Uploader(readStream, writeStream) {
	// 状态说明：
	// 起始状态为 stop
	// stop --start()--> start
	// start --cancel()--> cancel
	// start --pause()--> pause
	// start --*finish--> finish
	// pause --resume()--> start
	// pause --cancel()--> cancel
	// finish 没有转移路径了
	// 注意没有 error 状态
	// 因为关于错误是另外一个独立的状态

	this.state = 'stop';
	this.errorOccursed = false;
	this.bytesSended = 0;
	this.interval = undefined;	// 测速时使用的定时器

	this.readStream = readStream;
	this.writeStream = writeStream;

	this.onSpeed = undefined;
	this.onCancel = undefined;
	this.onFinish = undefined;
	this.onError = undefined;
}

Uploader.prototype.start = function() {
	var self = this;

	if (!this.isStop()) return;
	this.setStart();

	this.readStream.on('data', _onData);
	this.writeStream.on('finish', _onFinish);
	this.writeStream.on('unpipe', _onUnpipe);

	this.writeStream.on('error', _onError);
	this.readStream.on('error', _onError);

	// 开始发送
	this.readStream.pipe(this.writeStream);

	function _onData(chunk) {
		self.bytesSended += chunk.length;
	}

	function _onFinish() {
		safeCall(self.onFinish);
	}

	function _onError(err) {
		this.errorOccursed = true;
		safeCall(self.onError, [err]);
	}

	function _onUnpipe() {
		safeCall(self.onCancel);
	}
}

Uploader.prototype.pause = function() {
	if (!this.isStart()) return;
	this.setPause();

	this.readStream.pause();
}

Uploader.prototype.resume = function() {
	if (!this.isPause()) return;
	this.setStart();

	this.readStream.resume();
}

Uploader.prototype.cancel = function() {
	if (!(this.isStart() || this.isPause())) return;
	this.setCancel();

	this.readStream.unpipe();
}

Uploader.prototype.enableSpeedCallback = function() {
	// 如果已经启用了，就什么也不做
	if (this.interval !== undefined) return;

	var self = this;
	var freq = 1000; // 定时器间隔

	var lastBytesSended = 0;
	this.interval = setInterval(function() {
		var delt = self.bytesSended - lastBytesSended;
		lastBytesSended = self.bytesSended;

		var speed = (delt * 1000) / freq; // 转换成每秒速度
		safeCall(self.onSpeed, [lastBytesSended, speed]);
	}, freq);
}

Uploader.prototype.disableSpeedCallback = function() {
	// 如果没有启用，就什么也不做
	if (this.interval === undefined) return;
	clearInterval(this.interval);
	this.interval = undefined;
}

// 用于判断当前状态的一系列函数

Uploader.prototype.isStop = function() {
	return this.state === 'stop';
}

Uploader.prototype.isStart = function() {
	return this.state === 'start';
}

Uploader.prototype.isPause = function() {
	return this.state === 'pause';
}

Uploader.prototype.isCancel = function() {
	return this.state === 'cancel';
}

Uploader.prototype.isFinish = function() {
	return this.state === 'finish';
}

// 用于设定当前状态的一系列函数

Uploader.prototype.setStop = function() {
	this.state = 'stop';
}

Uploader.prototype.setStart = function() {
	this.state = 'start';
}

Uploader.prototype.setPause = function() {
	this.state = 'pause';
}

Uploader.prototype.setCancel = function() {
	this.state = 'cancel';
}

Uploader.prototype.setFinish = function() {
	this.state = 'finish';
}

// test

// var fs = require('fs'),
// 	path = require('path');
// var iFile = path.resolve(__dirname, '../', 'test.rar'),
// 	oFile = path.resolve(__dirname, '../', 'test-copy.rar');

// var rsFile = fs.createReadStream(iFile),
// 	wsFile = fs.createWriteStream(oFile);

// var uploader = create(rsFile, wsFile);
// uploader.onFinish = function() {
// 	console.log('finish');
// }
// uploader.onSpeed = function(copiedBytes, speed) {
// 	console.log(speed);
// }
// uploader.start();
// uploader.enableSpeedCallback();