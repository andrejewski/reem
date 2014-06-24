
var Ware = require('../lib/ware'),
	assert = require('assert');

function inc(i,c,n) {
	i.i = i.i || 0;
	c.i = c.i || 0;
	i.i++;
	c.i++;
	n(null, i);
}

describe("Ware", function() {
	describe("#constructor()", function() {
		it('should not require the `new` keyword', function() {
			var withNew = new Ware(),
				withoutNew = Ware();
			assert.ok(withNew instanceof Ware);
			assert.ok(withoutNew instanceof Ware);
		});
		it('should accept a default context', function() {
			var c = {},
				g = Ware(c);
			assert.equal(c, g.context);
		});
	});
	describe("#use()", function() {
		it('should be a no-op given no arguments', function() {
			var group = Ware();
			assert.equal(group.plugs.length, 0);
			assert.equal(group.use().plugs.length, 0);
		});
		it('should return itself to be chain-able', function() {
			var group = Ware();
			assert.equal(group, group);
			assert.equal(group, group.use());
			assert.equal(group, group.use().use());
		});
		it('should add one middleware given one function', function() {
			var group = Ware();
			assert.equal(group.use(inc).plugs.length, 1);
			assert.equal(group.use(inc).plugs.length, 2);
		});
		it('should add x middleware given X function arguments', function() {
			assert.equal(Ware().use(inc).plugs.length, 1);
			assert.equal(Ware().use(inc, inc).plugs.length, 2);
			assert.equal(Ware().use(inc, inc, inc).plugs.length, 3);
		});
		it('should add x middleware given X-length array of functions', function() {
			assert.equal(Ware().use([inc]).plugs.length, 1);
			assert.equal(Ware().use([inc, inc]).plugs.length, 2);
			assert.equal(Ware().use([inc, inc, inc]).plugs.length, 3);
		});
		it('should add one middleware given another Ware', function() {
			assert.equal(Ware().use(Ware()).plugs.length, 1);
		});
		it('should add one middleware given a Ware interface', function() {
			assert.equal(Ware().use({'run': inc}).plugs.length, 1);
		});
		it('should throw for non-(function, Ware, Ware interface) arguments', function() {
			assert.throws(function() {
				Ware().use(8);
			}, Error);
			assert.throws(function() {
				Ware().use('Kevin Spacey');
			}, Error);
			assert.throws(function() {
				Ware().use({eric: 'cartman'});
			}, Error);
		});
	});
	describe("#run()", function() {
		it('should return itself to be chain-able', function() {
			var group = Ware(),
				noop = function() {};
			assert.equal(group, group);
			assert.equal(group, group.run({}, {}, noop));
			assert.equal(group, group.run({}, {}, noop).run({}, {}, noop));
		});
		it('should use the constructor context if one is not provided', function(done) {
			var c = {},
				g = Ware(c).use(inc, inc, function(item, context, next) {
					assert.equal(c, context);
					next(null, item);
					done();
				});
			g.run({}, function(error, item) {})
		});
		it('should pass item and context to each middleware', function(done) {
			var g = Ware().use(inc, inc, function(item, context, next) {
				assert.deepEqual(item, {i:2});
				assert.deepEqual(context, {i:2});
				next(null, item);
				done();
			});
			g.run({}, {}, function(error, item) {});
		});
		it('should pass final item to callback', function(done) {
			var g = Ware().use(inc, inc);
			g.run({}, {}, function(error, item) {
				assert.deepEqual(item, {i:2});
				done();
			});
		});
		it('should halt middleware execution on error', function(done) {
			var o = {n:0},
				e = new Error('test'),
				g = Ware().use(inc, function(_, _, next) {
					next(e);
				}, inc);
			g.run(o, {}, function(error) {
				assert.equal(error, e);
				assert.deepEqual(o, {n:0, i:1});
				done();
			});
		});
		it('should execute function middleware properly', function(done) {
			var g = Ware().use(inc);
			g.run({}, {}, function(error, item) {
				assert.deepEqual(item, {i:1});
				done();
			});
		});
		it('should execute Ware middleware properly', function(done) {
			var g = Ware().use(Ware().use(inc));
			g.run({}, {}, function(error, item) {
				assert.deepEqual(item, {i:1});
				done();
			});
		});
		it('should execute Ware interface middleware properly', function(done) {
			var g = Ware().use({'run': inc});
			g.run({}, {}, function(error, item) {
				assert.deepEqual(item, {i:1});
				done();
			});
		});
	});
});


