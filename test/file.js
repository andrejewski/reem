
var path = require('path'),
	File = require('../lib/file'),
	assert = require('assert');

function pp(str) {
	// platform-path agnostic
	return str.split('/').join(path.sep);
}

describe("File", function() {
	describe("#constructor()", function() {
		it('should accept a path String argument', function() {
			assert.doesNotThrow(function() {
				File(__dirname);
			});
			assert.doesNotThrow(function() {
				File("__dirname");
			});
		});
		it('should throw for any non-String', function() {
			assert.throws(function() {
				File({eric: 'cartman'});
			}, Error);
			assert.throws(function() {
				File(1890);
			}, Error);
			assert.throws(function() {
				File(function() {
					return "Kevin Spacey";
				});
			}, Error);
		});
		it('should return an object', function() {
			assert.equal('object', typeof File(__dirname));
		});
	});
	describe("#readIgnore()", function() {
		it("should return a Boolean", function() {
			var fs = File(__dirname);
			assert.equal("boolean", typeof fs.readIgnore(".extension"));
			assert.equal("boolean", typeof fs.readIgnore("basename"));
			assert.equal("boolean", typeof fs.readIgnore("basename.extension"));
		});
		it("should, by default, filter out hidden files", function() {
			var fs = File(__dirname);

			assert.equal(true, fs.readIgnore("normal.txt"));
			assert.equal(true, fs.readIgnore("normal."));
			assert.equal(true, fs.readIgnore("normal"));

			assert.equal(false, fs.readIgnore(".gitignore"));
			assert.equal(false, fs.readIgnore(".DS_Store"));
		});
		it("should use the regexes in array File.ignoreRegexes", function() {
			var fs = File(__dirname);
			assert.equal(true, fs.readIgnore("normal.txt"));
			fs.ignoreRegexes.push(/.*/);
			assert.equal(false, fs.readIgnore("normal.txt"));
			fs.ignoreRegexes = [];
			assert.equal(true, fs.readIgnore("normal.txt"));
		});
	});
	describe("#outputPath()", function() {
		it("should accept an item", function() {
			var fs = File(__dirname),
				item = {
					basename: 'normal',
					extension: '.txt',
					list: {
						outputPath: pp('/root')
					}
				};
			assert.equal(pp("/root/normal.txt"), fs.outputPath(item));
		});
		it("should accept an item and filename", function() {
			var fs = File(__dirname),
				item = {
					basename: 'normal',
					extension: '.txt',
					list: {
						outputPath: pp('/root')
					}
				};
			assert.equal(pp("/root/filename"), fs.outputPath(item, "filename"));
		});
		it("should return a filepath String", function() {
			var fs = File(__dirname),
				item = {
					outputPath: path.join('output', 'webpage.html')
				};
			assert.equal(pp("output/webpage.html"), fs.outputPath(item));
			assert.equal("string", typeof fs.outputPath(item));
		});
	});
	describe("#urlPath()", function() {
		it("should accept an item", function() {
			var fs = File(__dirname),
				item = {
					outputPath: path.join(__dirname, 'output', 'webpage')
				};
			assert.equal("/webpage", fs.urlPath(item));
		});
		it("should return a URL String", function() {
			var fs = File(__dirname),
				item = {
					outputPath: path.join(__dirname, 'output', 'webpage.html')
				};
			assert.equal(fs.urlPath(item), fs.urlPath(item).split(path.sep).join("/"));
			assert.equal("string", typeof fs.urlPath(item));
		});
	});
	describe(".source", function() {
		it("should be the root list node", function() {
			var s = File(__dirname).source;
			assert.ok(s.rootList);
		});
		it("should have the default source path", function() {
			var s = File(__dirname).source;
			assert.equal(s.sourcePath, path.join(__dirname, 'source'));
		});
		it("should have the default output path", function() {
			var s = File(__dirname).source;
			assert.equal(s.outputPath, path.join(__dirname, 'output'));
		});
	});
	describe(".layout", function() {
		it("should have the default layout path", function() {
			assert.equal(File(__dirname).layout.filepath, path.join(__dirname, 'layout'));
		});
	});
});