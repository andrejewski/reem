
var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	rimraf = require('rimraf'),
	clone = require('clone'),
	yaml = require('js-yaml'),
	front = require('front-matter'),
	consolidate = require('consolidate'),
	File = require('./file'),
	Ware = require('./ware');

function extend(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		if(!source) return;
		for(var prop in source) {
			obj[prop] = source[prop];
		}
	});
	return obj;
}

function defaults(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		if(!source) return;
		for(var prop in source) {
			if(obj[prop] === void 0) obj[prop] = source[prop];
		}
	});
	return obj;
}

function Reem(dir) {
	if(!(this instanceof Reem)) return new Reem(dir);

	this.data = {};
	this.view = {};
	this.env = {production: false};

	this.fs = File(dir);

	this.Post = this.ware();
	this.File = this.ware();
	this.List = this.ware().use(index);

	this.pages = [];
	this.Page = this.ware();
}

Reem.prototype.ware = function() {
	return Ware(this);
}

Reem.prototype.addPage = function(page) {
	this.pages.push(defaults(page, {
		filetype: 'page',
		fixedWrite: true,
		renderFile: true
	}));
	return this;
}

Reem.prototype.build = function(tree, next) {
	if(!next) {
		next = tree;
		tree = this.fs.source;
	}
	var reem = this,
		process = ['cache', 'link', 'fill', 'clean', 'write'].map(function(func) {
			return reem[func].bind(reem);
		});
	if(tree === this.fs.source) process.unshift(this.read);
	process[0] = process[0].bind(this, tree);
	async.waterfall(process, reem.error(next));
}

Reem.prototype.diffBuild = function(filepath, next) {
	var reem = this,
		tree = this._tree;
	if(!tree) return reem.build(next);
	if(filepath.indexOf(tree.sourcePath) === -1) return this.build(tree, next);
	var dirname = path.dirname(filepath),
		extension = path.extname(dirname),
		listNode = {
			sourcePath: dirname,
			basename: path.basename(dirname, extension),
			extension: extension
		};
	this.read(listNode, function(error, branch) {
		if(error) return next(error);
		(function findAndReplace(list) {
			if(list.sourcePath === branch.sourcePath) {
				extend(list, branch);
				return reem.build(tree, next);
			}
			list.lists.forEach(findAndReplace);
		})(tree);
	});
	return this;
}

Reem.prototype.read = function(tree, next) {
	var reem = this;
	(function readList(list, next) {
		async.waterfall([
			readdir.bind(null, list.sourcePath),
			map(parseNode),
			map(labelNode),
			mergeFiles.bind(null, list)
		], next);

		function readdir(dir, done) {
			fs.readdir(dir, function(error, files) {
				if(error) return done(error);
				done(error, files.filter(reem.fs.readIgnore));
			});
		}

		function map(fx, array) {
			if(array) return function(done) {
				async.map(array, fx, done);
			}
			return function(array, done) {
				async.map(array, fx, done);
			}
		}

		function parseNode(file, done) {
			var sourcePath = path.join(list.sourcePath, file);
			fs.stat(sourcePath, function(error, stats) {
				if(error) return done(error);
				var ext = path.extname(sourcePath);
				done(error, {
					sourcePath: sourcePath,
					basename: path.basename(sourcePath, ext),
					extension: ext,
					readType: (function(e) {
						var exts = reem.fs.extensions;
						for(var type in exts) {
							if(exts[type].indexOf(e) !== -1) return type;
						}
						return 'other';
					})(ext),
					isDirectory: stats.isDirectory()
				});
			});
		}

		function labelNode(file, done) {
			if(file.isDirectory) {
				file.filetype = 'list';
				return readList(file, done);
			} else if(file.readType === 'post') {
				return done(null, defaults(file, {
					filetype: 'post',
					renderFile: true
				}));
			}
			file.filetype = 'file';
			done(null, file);
		}

		function mergeFiles(list, files, next) {
			async.waterfall([
				map(mergeFile(files), files.concat(list)),
				attachNodes
			], next);

			function mergeFile(files) {
				if(!files.length) return function(file, done) {
					done(null, file);
				}
				return function(file, done) {
					if(file.filetype === 'file') return done(null, file);
					mergeData(file, files.filter(function(f) {
						var support = file.basename === f.basename && file !== f;
						if(support) f.supportFile = true;
						return support;
					}), done);
				}
			}

			function mergeData(item, supportFiles, done) {
				async.waterfall([
					map(readFile, supportFiles.concat(item)),
					function(datas, next) {
						next(null, extend.apply(null, [item].concat(datas)));
					}
				], done);
			}

			function readFile(file, done) {
				switch(file.readType) {
					case 'yaml':
						return fs.readFile(file.sourcePath, 'utf8', function(error, data) {
							done(error, yaml.safeLoad(data));
						});
					case 'json':
						return fs.readFile(file.sourcePath, 'utf8', function(error, data) {
							done(error, JSON.parse(data));
						});
					case 'javascript':
						var script = require(file.sourcePath);
						if(typeof script === 'function') {
							script = script(reem);
						}
						return done(null, script || {});
					case 'post':
						return fs.readFile(file.sourcePath, 'utf8', function(error, data) {
							if(error) return done(error);
							data = front(data);
							data.attributes.content = data.body;
							done(error, data.attributes);
						});
					default: done(null, {});
				}
			}

			function attachNodes(files, done) {
				['post', 'file', 'list'].forEach(function(type) {
					list[type+'s'] = files.filter(function(f) {
						return f.filetype === type && f !== list;
					});
				});
				done(null, list);
			}
		}
	})(tree, next);
}

Reem.prototype.cache = function(tree, next) {
	this._tree = clone(tree);
	next(null, tree);
}

Reem.prototype.link = (function linkTree(parent) {
	return function(list, next) {
		list.list = parent;
		['posts', 'files'].forEach(function(group) {
			list[group].forEach(function(item) {
				item.list = list;
			});
		});
		async.each(list.lists, linkTree(list), function(error) {
			next(error, list);
		});
	}
})(null);

Reem.prototype.fill = function(tree, done) {
	var reem = this;
	fill(tree.filetype+'s', tree, done);

	function fill(kind, node, next) {
		switch(kind) {
			case 'posts': return reem.Post.run(node, fin(next));
			case 'files': return reem.File.run(node, fin(next));
			case 'lists':
				return async.waterfall([
					fillListNodes.bind(null, node),
					function(listNodes, done) {
						reem.List.run(extend(node, listNodes), done);
					}
				], next);
			default: next(new Error('Unknown item kind '+kind)); 
		}

		function fin(callback) {
			return function(error, node) {
				callback(error, reem.fs.pathItem(node));
			}
		}
	}

	function fillListNodes(list, done) {
		list = reem.fs.pathItem(list);
		var kinds = ['posts', 'files', 'lists'],
			resp = {};

		kinds.forEach(function(kind) {
			resp[kind] = [];
		});

		async.doUntil(async.parallel.bind(null, kinds.map(fillNodes)), function() {
			return 0 === (list.posts.length + list.files.length + list.lists.length);
		}, function(error) {
			done(error, resp);
		});

		function fillNodes(kind) {
			return function(next) {
				async.map(list[kind].splice(0, Infinity), fill.bind(null, kind), function(error, items) {
					if(error) return next(error);
					resp[kind] = resp[kind].concat(items);
					next(error);
				});
			}
		}
	}
}

Reem.prototype.clean = function(tree, next) {
	var dir = tree.outputPath;
	fs.readdir(dir, function(error, files) {
		if(error) return fs.mkdir(dir, then);
		async.each(files, function(file, done) {
			rimraf(path.join(dir, file), done);
		}, then);
	});

	function then(error) {
		next(error, tree);
	}
}

Reem.prototype.write = function(tree, next) {
	var reem = this;

	async.series([
		writeList.bind(null, tree),
		async.each.bind(null, reem.pages, writePage)
	], next);

	function writeList(list, done) {
		if(list.ignore) return done(null);
		async.series([mkdirList, writeNodes], done);

		function mkdirList(done) {
			if(list.rootList) return done(null);
			fs.mkdir(list.outputPath, done);
		}

		function writeNodes(done) {
			async.parallel([
				each(list.posts, writeItem),
				each(list.files, writeItem),
				each(list.lists, writeList)
			], done);
		}

		function each(array, fx) {
			return async.each.bind(null, array, fx);
		}
	}

	function writePage(page, next) {
		reem.Page.run(page, function(error, page) {
			if(error) return next(error);
			var fragOut = page.url.split('/').join(path.sep);
			page.outputPath = path.join(reem.fs.source.outputPath, fragOut);
			writeItem(reem.fs.pathItem(page), next);
		});
	}

	function writeItem(item, done) {
		if(item.ignore || item.supportFile) return done(null);
		async.waterfall((item.fixedWrite 
			? [mkdirp.bind(null, item.outputPath)]
			: []).concat([reem.render.bind(reem, item), write]), done);

		function write(content, next) {
			content 
				? fs.writeFile(item.outputPath, content, next)
				: fs.createReadStream(item.sourcePath)
					.on('error', next)
					.pipe(fs.createWriteStream(item.outputPath)
						.on('error', next)
						.on('close', next));
		}
	}

	function mkdirp(filepath, done) {
		var dir = path.dirname(filepath);
		fs.stat(dir, function(error, stats) {
			if(error && error.code === "ENOENT") return async.series([
				mkdirp.bind(null, dir),
				fs.mkdir.bind(null, dir)
			], done);
			if(error || stats.isDirectory()) return done(error);
			done(new Error("Page cannot be written to non-directory "+dir));
		});
	}
}

Reem.prototype.render = function(item, next) {
	if(!item.renderFile) return next(null, item.content);
	item.view = item.view || item.filetype+(this.view.extension || "."+this.view.engine);
	var template = path.join(this.fs.layout.filepath, item.view),
		render = consolidate[this.view.engine],
		locals = extend({}, this.view, {g: this.data});
		locals[item.filetype] = locals.item = item;
	if(!render) return next(null, item.content);
	render(template, locals, next);
}

Reem.prototype.error = function(next) {
	return next || function(error) {};
}

function index(list, reem, done) {
	if(list.index && list.filetype === 'list') {
		var indexFile = list.indexFilename || 'index.html',
			outputPath = path.join(list.outputPath, indexFile),
			ext = path.extname(indexFile);
		list.files.push(defaults({
			basename: path.basename(indexFile, ext),
			extension: ext,
			renderFile: true,
			outputPath: outputPath,
			url: reem.fs.urlPath({outputPath: outputPath})
		}, list));
	}
	done(null, list);
}

Reem.Ware = Ware;
module.exports = Reem;
