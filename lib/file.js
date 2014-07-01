// fs.js

var path = require('path');

module.exports = function(dir) {
	var root = path.normalize(dir),
		fs = {
			root: root,
			ignoreRegexes: [(/^\./)],
			source: {
				rootList: true,
				filetype: 'list',
				sourcePath: path.join(root, 'source'),
				outputPath: path.join(root, 'output'),
				url: ''
			},
			layout: {
				filepath: path.join(root, 'layout')
			},
			extensions: {
				yaml: ['.yml', '.yaml'],
				json: ['.json'],
				javascript: ['.js'],
				post: ['.md', '.markdown'],
			}
		};

	fs.readAccept = function(filename) {
		return !fs.ignoreRegexes.reduce(function(s,c) {
			return s || c.test(filename);
		}, false);
	}

	fs.pathItem = function(item, name) {
		item.outputPath = outputPath(item, name);
		item.url = urlPath(item);
		return item;
	}

	function outputPath(item, name) {
		return item.outputPath || path.join(outputPath(item.list), filename(item));

		function filename(item) {
			return name || item.basename+(item.extension || "") || item.filename;
		}
	}

	function urlPath(item) {
		if(item.rootList) return item.url;
		var p = path.relative(fs.source.outputPath, item.outputPath);
		return [fs.source.url].concat(p.split(path.sep)).join('/');
	}

	fs.outputPath = outputPath;
	fs.urlPath = urlPath;

	return fs;
}
