exports.safeCall = safeCall;

function safeCall(f, argList, _this) {
	if (typeof f !== 'function') return;
	try {
		f.apply(_this, argList);
	} catch(err) {
		debugger;
		console.log('[safeCall] ' + err.toString());
	}
}