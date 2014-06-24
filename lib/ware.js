
var async = require('async');

function Ware(context) {
	if(!(this instanceof Ware)) return new Ware(context);
	this.context = context;
	this.plugs = [];
	this.use = this.use.bind(this);
	this.run = this.run.bind(this);
	return this;
}

Ware.prototype.use = function(plug) {
	if(arguments.length !== 1) {
		plug = Array.prototype.slice.call(arguments, 0);
	}
	if(Array.isArray(plug)) {
		var use = this.use;
		plug.forEach(function(x) {use(x)});
	} else {
		if((plug instanceof Ware) || typeof plug.run === 'function') {
			plug = plug.run;
		}
		if(typeof plug !== 'function') {
			throw new Error(plug+" is an invalid plugin.");
		}
		this.plugs.push(plug);
	}
	return this;
}

Ware.prototype.run = function(item, context, done) {
	if(!done) {
		done = context;
		context = this.context;
	}
	async.reduce(this.plugs, item, iterator, done);
	return this;

	function iterator(memo, fx, next) {
		fx(memo, context, next);
	}
}

module.exports = Ware;
